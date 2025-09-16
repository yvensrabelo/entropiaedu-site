// Webhook para receber notificações do Mercado Pago - Vercel Serverless Function
import crypto from 'crypto';

// Configurações
const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET || 'your_webhook_secret_here';
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

/**
 * Buscar detalhes do pagamento usando fetch direto
 */
async function getPaymentDetails(paymentId) {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar detalhes do pagamento:', error);
    throw error;
  }
}

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
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // Responder sempre com 200 para evitar reenvios
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    console.log('❌ Método não permitido:', req.method);
    return res.status(200).json({
      success: false,
      error: 'Método não permitido',
      received_method: req.method
    });
  }

  try {
    // Extrair dados da requisição (múltiplos formatos possíveis)
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-request-id'];

    // Tentar diferentes formas de extrair o payment ID
    let paymentId = null;
    let topic = null;

    // Formato novo: {"action": "payment.updated", "data": {"id": "123"}}
    if (req.body?.action && req.body?.data?.id) {
      paymentId = req.body.data.id;
      topic = req.body.action;
      console.log('📋 Formato novo detectado - Action:', topic, 'ID:', paymentId);
    }
    // Formato query: ?topic=payment&id=123
    else if (req.query?.id) {
      paymentId = req.query.id;
      topic = req.query.topic;
      console.log('📋 Formato query detectado - Topic:', topic, 'ID:', paymentId);
    }
    // Formato antigo: {"topic": "payment", "resource": "..."}
    else if (req.body?.resource) {
      const resourceParts = req.body.resource.split('/');
      paymentId = resourceParts[resourceParts.length - 1];
      topic = req.body.topic;
      console.log('📋 Formato antigo detectado - Topic:', topic, 'ID:', paymentId);
    }

    if (!paymentId) {
      console.log('❌ Payment ID não encontrado');
      return res.status(200).json({
        success: false,
        error: 'Payment ID não encontrado',
        received_data: { query: req.query, body: req.body }
      });
    }

    // Verificar se é notificação de pagamento
    const isPaymentEvent = topic && (
      topic === 'payment' ||
      topic === 'payment.updated' ||
      topic.includes('payment')
    );

    if (!isPaymentEvent) {
      console.log('⚠️ Evento ignorado:', topic);
      return res.status(200).json({
        success: true,
        message: 'Evento ignorado',
        topic: topic
      });
    }

    console.log(`💰 Processando pagamento ID: ${paymentId}`);

    // Buscar detalhes do pagamento
    let paymentData;
    try {
      paymentData = await getPaymentDetails(paymentId);
      console.log('📊 Dados do pagamento obtidos:', {
        id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        transaction_amount: paymentData.transaction_amount,
        payer_email: paymentData.payer?.email,
        external_reference: paymentData.external_reference,
        payment_method_id: paymentData.payment_method_id
      });
    } catch (apiError) {
      console.error('❌ Erro ao buscar pagamento da API MP:', apiError.message);
      return res.status(200).json({
        success: false,
        error: 'Erro ao buscar detalhes do pagamento',
        payment_id: paymentId,
        api_error: apiError.message
      });
    }

    // Só enviar webhook se o pagamento foi aprovado
    if (paymentData.status === 'approved') {
      console.log('✅ Pagamento aprovado - enviando webhook de confirmação');

      // Extrair CPF e telefone do payer
      const cpf = paymentData.payer?.identification?.number || '';
      const telefone = paymentData.payer?.phone ?
        `${paymentData.payer.phone.area_code}${paymentData.payer.phone.number}` : '';

      // Preparar dados para o webhook externo
      const webhookData = {
        payment_id: paymentId,
        external_reference: paymentData.external_reference || '',
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        timestamp: new Date().toISOString(),
        cpf: cpf,
        telefone: telefone,
        email: paymentData.payer?.email || '',
        valor: paymentData.transaction_amount || 0,
        payment_method: paymentData.payment_method_id,
        installments: paymentData.installments || 1,
        currency: paymentData.currency_id || 'BRL'
      };

      console.log('📤 Enviando webhook:', webhookData);

      // Enviar para o webhook de confirmação
      try {
        const webhookResponse = await fetch('https://webhook.cursoentropia.com/webhook/PAGAMENTOSVIR2025', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'EntropiaEdu-Webhook/1.0'
          },
          body: JSON.stringify(webhookData),
          timeout: 10000 // 10 segundos de timeout
        });

        const responseText = await webhookResponse.text();

        console.log('🚀 Webhook enviado:', {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          response: responseText,
          url: 'webhook.cursoentropia.com/webhook/PAGAMENTOSVIR2025'
        });

        if (!webhookResponse.ok) {
          console.error('⚠️ Webhook retornou erro:', webhookResponse.status, responseText);
        }

      } catch (webhookError) {
        console.error('❌ Erro ao enviar webhook:', webhookError.message);
      }
    } else {
      console.log(`⚠️ Pagamento com status '${paymentData.status}' - não enviando confirmação`);
    }

    // Resposta de sucesso
    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      payment_id: paymentId,
      payment_status: paymentData.status,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Erro geral no webhook:', error);

    // Sempre retornar 200 para evitar reenvios do MP
    return res.status(200).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      note: 'Retornando 200 para evitar reenvio'
    });
  }
}