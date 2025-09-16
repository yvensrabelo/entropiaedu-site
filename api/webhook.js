// Webhook para receber notificações do Mercado Pago - Vercel Serverless Function
import crypto from 'crypto';
import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configurações
const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET || 'your_webhook_secret_here';
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

// Configurar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: ACCESS_TOKEN,
  options: {
    timeout: 5000
  }
});

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
    const dataID = req.query.id || req.query['data.id'] || req.body?.data?.id;

    // Log para debug
    console.log('Dados recebidos:', {
      signature: xSignature,
      requestId: xRequestId,
      dataId: dataID,
      topic: req.query.topic || req.body?.type
    });

    // Verificar se é notificação de pagamento
    const topic = req.query.topic || req.body?.type || req.body?.topic;

    // O Mercado Pago pode enviar 'payment' ou 'payment.updated'
    if (!topic || (!topic.includes('payment') && topic !== 'payment.updated')) {
      console.log('Tópico ignorado:', topic);
      return res.status(200).json({ message: 'Tópico ignorado' });
    }

    // Validar assinatura (apenas se secret estiver configurado corretamente)
    if (WEBHOOK_SECRET && WEBHOOK_SECRET !== 'your_webhook_secret_here' && WEBHOOK_SECRET !== 'temp_secret_for_deploy_123') {
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
      console.log('⚠️ Webhook secret não configurado corretamente - pulando validação');
    }

    // Processar notificação
    if (dataID) {
      console.log(`📋 Processando pagamento ID: ${dataID}`);

      try {
        // Buscar detalhes do pagamento na API do Mercado Pago
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: dataID });

        console.log('💰 Detalhes do pagamento:', {
          id: paymentData.id,
          status: paymentData.status,
          status_detail: paymentData.status_detail,
          transaction_amount: paymentData.transaction_amount,
          payer_email: paymentData.payer?.email,
          external_reference: paymentData.external_reference
        });

        // Só enviar webhook se o pagamento foi aprovado
        if (paymentData.status === 'approved') {
          // Extrair CPF e telefone do payer
          const cpf = paymentData.payer?.identification?.number || '';
          const telefone = paymentData.payer?.phone ?
            `${paymentData.payer.phone.area_code}${paymentData.payer.phone.number}` : '';

          // Preparar dados para o webhook externo
          const webhookData = {
            payment_id: dataID,
            external_reference: paymentData.external_reference || '',
            status: paymentData.status,
            status_detail: paymentData.status_detail,
            timestamp: new Date().toISOString(),
            cpf: cpf,
            telefone: telefone,
            email: paymentData.payer?.email || '',
            valor: paymentData.transaction_amount || 0,
            payment_method: paymentData.payment_type_id,
            installments: paymentData.installments
          };

          // Enviar para o webhook de confirmação de pagamento
          try {
            const webhookResponse = await fetch('https://webhook.cursoentropia.com/webhook/PAGAMENTOSVIR2025', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(webhookData)
            });

            console.log('✅ Webhook de confirmação enviado:', {
              status: webhookResponse.status,
              statusText: webhookResponse.statusText,
              data: webhookData
            });

            // Se quiser também enviar para N8N, descomente:
            /*
            const n8nResponse = await fetch('SUA_URL_N8N_AQUI', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(webhookData)
            });
            console.log('✅ Webhook N8N enviado:', n8nResponse.status);
            */

          } catch (webhookError) {
            console.error('❌ Erro ao enviar webhook de confirmação:', webhookError);
            // Não falhar o webhook do MP por causa de erro no webhook externo
          }
        } else {
          console.log(`⚠️ Pagamento com status ${paymentData.status} - não enviando webhook de confirmação`);
        }

        console.log('🎉 Notificação processada com sucesso');

      } catch (apiError) {
        console.error('❌ Erro ao buscar detalhes do pagamento:', apiError);
        // Log do erro mas retorna 200 para não reenviar
        console.error('Detalhes do erro:', apiError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Erro no webhook:', error);

    // Retornar 200 mesmo com erro para evitar reenvios
    return res.status(200).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      note: 'Retornando 200 para evitar reenvio'
    });
  }
}