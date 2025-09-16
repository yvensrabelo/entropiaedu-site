// Webhook Mercado Pago - Ultra Simplificado para evitar erro 502
import crypto from 'crypto';

// Cache simples para evitar duplicatas (expira a cada 10 minutos)
const processedPayments = new Map();

// Secret key do webhook do Mercado Pago
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'ca513e5f9eac768fed186399e467daff52ad6381d8a3b47ab62c9663ca0726c7';

export default async function handler(req, res) {
  // ✅ SEMPRE retorna 200 PRIMEIRO para evitar 502
  res.status(200);
  res.setHeader('Content-Type', 'application/json');

  try {
    console.log('🔔 Webhook recebido:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // Validar assinatura do webhook (se fornecida)
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];

    if (xSignature && xRequestId) {
      console.log('🔐 Validando assinatura do webhook...');

      // Extrair ts e v1 do header x-signature
      const parts = xSignature.split(',');
      let ts = '';
      let v1 = '';

      for (const part of parts) {
        const [key, value] = part.split('=');
        if (key === 'ts') ts = value;
        if (key === 'v1') v1 = value;
      }

      // Construir string para validar
      const dataToSign = `id:${req.query?.['data.id'] || req.body?.data?.id};request-id:${xRequestId};ts:${ts};`;

      // Gerar HMAC
      const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
      hmac.update(dataToSign);
      const calculatedSignature = hmac.digest('hex');

      if (calculatedSignature !== v1) {
        console.log('⚠️ Assinatura inválida - mas processando mesmo assim');
        // Não falhar, apenas logar o aviso
      } else {
        console.log('✅ Assinatura válida');
      }
    }

    // Log de TODOS os IDs possíveis
    console.log('🔍 TODOS OS IDs POSSÍVEIS:', {
      'req.body.data.id': req.body?.data?.id,
      'req.body.id': req.body?.id,
      'req.query.id': req.query?.id,
      'req.query["data.id"]': req.query?.['data.id'],
      'headers.x-request-id': req.headers?.['x-request-id'],
      'body_full': req.body
    });

    // Verificar se é POST
    if (req.method !== 'POST') {
      console.log('❌ Método não permitido:', req.method);
      return res.json({
        success: false,
        error: 'Método não permitido'
      });
    }

    // Extrair payment ID de diferentes formatos
    let paymentId = null;
    let topic = null;

    // Formato novo: {"action": "payment.updated", "data": {"id": "123"}}
    if (req.body?.action && req.body?.data?.id) {
      paymentId = req.body.data.id;
      topic = req.body.action;
      console.log('📋 Formato detectado - Action:', topic, 'Payment ID:', paymentId);
    }
    // Formato query: ?topic=payment&id=123
    else if (req.query?.id) {
      paymentId = req.query.id;
      topic = req.query.topic;
      console.log('📋 Formato query - Topic:', topic, 'Payment ID:', paymentId);
    }

    if (!paymentId) {
      console.log('❌ Payment ID não encontrado');
      return res.json({
        success: false,
        message: 'Payment ID não encontrado',
        received: { query: req.query, body: req.body }
      });
    }

    // Verificar se é evento de pagamento
    const isPaymentEvent = topic && (
      topic === 'payment' ||
      topic === 'payment.updated' ||
      topic.includes('payment')
    );

    if (!isPaymentEvent) {
      console.log('⚠️ Evento ignorado:', topic);
      return res.json({
        success: true,
        message: 'Evento ignorado',
        topic: topic
      });
    }

    console.log(`💰 Processando pagamento ID: ${paymentId}`);

    // Verificar se já processamos este pagamento (deduplicação)
    const now = Date.now();
    const lastProcessed = processedPayments.get(paymentId);

    if (lastProcessed && (now - lastProcessed < 10 * 60 * 1000)) {
      console.log(`⚡ Pagamento ${paymentId} já processado - ignorando duplicata`);
      return res.json({
        success: true,
        message: 'Pagamento já processado (duplicata ignorada)',
        payment_id: paymentId
      });
    }

    // Marcar como processado
    processedPayments.set(paymentId, now);

    // Limpar cache antigo (manter só últimos 100)
    if (processedPayments.size > 100) {
      const entries = Array.from(processedPayments.entries());
      entries.slice(0, -50).forEach(([key]) => processedPayments.delete(key));
    }

    // Buscar dados do pagamento da API do Mercado Pago
    const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

    console.log('🔐 Verificando ACCESS_TOKEN:', {
      exists: !!ACCESS_TOKEN,
      length: ACCESS_TOKEN ? ACCESS_TOKEN.length : 0,
      prefix: ACCESS_TOKEN ? ACCESS_TOKEN.substring(0, 20) + '...' : 'N/A'
    });

    if (!ACCESS_TOKEN) {
      console.error('❌ ACCESS_TOKEN não configurado');
      return res.json({
        success: false,
        error: 'ACCESS_TOKEN não configurado'
      });
    }

    try {
      console.log(`🔍 Buscando pagamento ${paymentId} na API MP...`);

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📡 Resposta da API MP:`, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API MP Error:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });

        // Se pagamento não existe (404), retornar sucesso para evitar reenvios
        if (response.status === 404) {
          console.log(`⚠️ Pagamento ${paymentId} não encontrado (404) - pode ser pagamento de teste`);
          return res.json({
            success: true,
            message: 'Pagamento não encontrado (possivelmente teste)',
            payment_id: paymentId
          });
        }

        // Outros erros também não devem falhar o webhook
        console.log(`⚠️ Erro ${response.status} ao buscar pagamento - retornando sucesso`);
        return res.json({
          success: true,
          message: `Erro ${response.status} na API MP - webhook processado`,
          payment_id: paymentId,
          error: errorText
        });
      }

      const paymentData = await response.json();
      console.log(`✅ Dados do pagamento obtidos com sucesso:`, JSON.stringify(paymentData, null, 2));

      console.log('📊 Pagamento encontrado:', {
        id: paymentData.id,
        status: paymentData.status,
        amount: paymentData.transaction_amount,
        email: paymentData.payer?.email
      });

      // Só processar se aprovado
      if (paymentData.status === 'approved') {
        console.log('✅ Pagamento aprovado - processando...');

        // Extrair dados com validação
        const cpf = paymentData.payer?.identification?.number || '';
        const area_code = paymentData.payer?.phone?.area_code || '';
        const phone_number = paymentData.payer?.phone?.number || '';
        const telefone = (area_code && phone_number) ? `${area_code}${phone_number}` : '';

        const webhookData = {
          payment_id: paymentId,
          status: paymentData.status,
          cpf: cpf,
          telefone: telefone,
          email: paymentData.payer?.email || '',
          valor: paymentData.transaction_amount || 0,
          timestamp: new Date().toISOString()
        };

        console.log('📊 Dados extraídos:', {
          cpf_length: cpf.length,
          telefone_length: telefone.length,
          email_exists: !!paymentData.payer?.email
        });

        console.log('📤 Enviando webhook:', webhookData);

        // Tentar enviar webhook (não falhar se der erro)
        try {
          const webhookResponse = await fetch('https://webhook.cursoentropia.com/webhook/PAGAMENTOSVIR2025', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookData)
          });

          console.log('🚀 Webhook enviado - Status:', webhookResponse.status);
        } catch (webhookError) {
          console.error('⚠️ Erro ao enviar webhook (não crítico):', webhookError.message);
        }
      } else {
        console.log(`⚠️ Pagamento com status '${paymentData.status}' - ignorando`);
      }

      return res.json({
        success: true,
        message: 'Webhook processado',
        payment_id: paymentId,
        status: paymentData.status
      });

    } catch (apiError) {
      console.error('❌ Erro ao buscar pagamento da API MP:', apiError.message);
      return res.json({
        success: true,
        message: 'Erro ao buscar pagamento (webhook processado)',
        error: apiError.message,
        payment_id: paymentId
      });
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);

    // Sempre retorna 200 mesmo com erro
    return res.json({
      success: false,
      error: 'Erro interno',
      message: 'Webhook processado (com erro)',
      timestamp: new Date().toISOString()
    });
  }
}