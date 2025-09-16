// Webhook Mercado Pago - Ultra Simplificado para evitar erro 502
export default async function handler(req, res) {
  // ✅ SEMPRE retorna 200 PRIMEIRO para evitar 502
  res.status(200);
  res.setHeader('Content-Type', 'application/json');

  try {
    console.log('🔔 Webhook recebido:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));

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

    // Buscar dados do pagamento da API do Mercado Pago
    const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!ACCESS_TOKEN) {
      console.error('❌ ACCESS_TOKEN não configurado');
      return res.json({
        success: false,
        error: 'ACCESS_TOKEN não configurado'
      });
    }

    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API MP Error: ${response.status}`);
      }

      const paymentData = await response.json();

      console.log('📊 Pagamento encontrado:', {
        id: paymentData.id,
        status: paymentData.status,
        amount: paymentData.transaction_amount,
        email: paymentData.payer?.email
      });

      // Só processar se aprovado
      if (paymentData.status === 'approved') {
        console.log('✅ Pagamento aprovado - processando...');

        // Extrair dados
        const cpf = paymentData.payer?.identification?.number || '';
        const telefone = paymentData.payer?.phone ?
          `${paymentData.payer.phone.area_code}${paymentData.payer.phone.number}` : '';

        const webhookData = {
          payment_id: paymentId,
          status: paymentData.status,
          cpf: cpf,
          telefone: telefone,
          email: paymentData.payer?.email || '',
          valor: paymentData.transaction_amount || 0,
          timestamp: new Date().toISOString()
        };

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
        success: false,
        error: 'Erro ao buscar pagamento',
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