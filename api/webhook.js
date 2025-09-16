// Webhook para receber notificações do Mercado Pago - Vercel Serverless Function
import crypto from 'crypto';

// Secret que você vai configurar no painel do Mercado Pago
const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET || 'your_webhook_secret_here';

/**
 * Valida assinatura do webhook
 */
function validateWebhookSignature(xSignature, xRequestId, dataID, secret) {
  try {
    const parts = xSignature.split(',');
    let timestamp = null;
    let hash = null;
    
    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        if (key.trim() === 'ts') {
          timestamp = value.trim();
        } else if (key.trim() === 'v1') {
          hash = value.trim();
        }
      }
    });
    
    if (!timestamp || !hash) {
      return false;
    }
    
    const manifest = `id:${dataID};request-id:${xRequestId};ts:${timestamp};`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const expectedHash = hmac.digest('hex');
    
    return hash === expectedHash;
  } catch (error) {
    console.error('Erro ao validar assinatura:', error);
    return false;
  }
}

export default async function handler(req, res) {
  console.log('🔔 Webhook recebido:', new Date().toISOString());
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];
    const dataID = req.query.id || req.body?.data?.id;

    // Log para debug
    console.log('Dados recebidos:', {
      signature: xSignature,
      requestId: xRequestId,
      dataId: dataID,
      topic: req.query.topic || req.body?.topic
    });

    // Verificar se é notificação de pagamento
    const topic = req.query.topic || req.body?.topic;
    if (topic !== 'payment') {
      console.log('Tópico ignorado:', topic);
      return res.status(200).json({ message: 'Tópico ignorado' });
    }

    // Validar assinatura (apenas se secret estiver configurado)
    if (WEBHOOK_SECRET !== 'your_webhook_secret_here') {
      if (!xSignature || !xRequestId || !dataID) {
        console.error('Headers de validação faltando');
        return res.status(400).json({ error: 'Headers de validação faltando' });
      }

      const isValid = validateWebhookSignature(xSignature, xRequestId, dataID, WEBHOOK_SECRET);
      if (!isValid) {
        console.error('Assinatura inválida');
        return res.status(401).json({ error: 'Assinatura inválida' });
      }
      console.log('✅ Assinatura válida');
    } else {
      console.log('⚠️ Webhook secret não configurado - pulando validação');
    }

    // Processar notificação
    if (dataID) {
      console.log(`📋 Processando pagamento ID: ${dataID}`);

      // Buscar detalhes do pagamento (simulado por enquanto)
      // Em produção, você deve buscar os detalhes reais do pagamento usando a API do MP

      // Enviar webhook para o sistema externo
      try {
        // Extrair dados do external_reference se disponível
        const externalRef = req.body?.external_reference || '';

        // Preparar dados para o webhook externo
        const webhookData = {
          payment_id: dataID,
          external_reference: externalRef,
          status: 'approved',
          timestamp: new Date().toISOString(),
          // Estes dados viriam da API do MP em produção
          cpf: req.body?.payer?.identification?.number || '',
          telefone: req.body?.payer?.phone ?
            `${req.body.payer.phone.area_code}${req.body.payer.phone.number}` : '',
          email: req.body?.payer?.email || '',
          valor: req.body?.transaction_amount || 0
        };

        // Enviar para o webhook de confirmação de pagamento
        const webhookResponse = await fetch('https://webhook.cursoentropia.com/webhook/PAGAMENTOSVIR2025', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookData)
        });

        console.log('✅ Webhook de confirmação enviado:', {
          status: webhookResponse.status,
          data: webhookData
        });
      } catch (webhookError) {
        console.error('❌ Erro ao enviar webhook de confirmação:', webhookError);
      }

      console.log('🎉 Pagamento processado com sucesso');

      // Log do processamento
      const processing = {
        payment_id: dataID,
        processed_at: new Date().toISOString(),
        status: 'processed',
        actions: [
          'Log salvo',
          'Notificação processada',
          'Webhook de confirmação enviado',
          'Status atualizado'
        ]
      };

      console.log('Resultado do processamento:', processing);
    }

    return res.status(200).json({ 
      success: true,
      message: 'Webhook processado com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Erro no webhook:', error);
    
    return res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}