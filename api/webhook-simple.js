// Webhook Mercado Pago - VERSÃO SUPER SIMPLIFICADA
// Apenas confirma recebimento e processa em background

export default async function handler(req, res) {
  // RETORNA 200 IMEDIATAMENTE - NADA MAIS
  res.status(200).json({ received: true });
  
  // Processa em background (não bloqueia a resposta)
  processWebhookAsync(req).catch(console.error);
}

async function processWebhookAsync(req) {
  try {
    console.log('🔔 Webhook recebido:', new Date().toISOString());
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // Extrair payment ID
    const paymentId = req.body?.data?.id || req.query?.id;
    
    if (!paymentId) {
      console.log('❌ Payment ID não encontrado');
      return;
    }
    
    console.log(`💰 Processing payment: ${paymentId}`);
    
    const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (!ACCESS_TOKEN) {
      console.error('❌ ACCESS_TOKEN não configurado');
      return;
    }
    
    // Buscar pagamento
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Erro ao buscar pagamento: ${response.status}`);
      return;
    }
    
    const paymentData = await response.json();
    console.log(`✅ Payment status: ${paymentData.status}`);
    
    // Só processa se aprovado
    if (paymentData.status === 'approved') {
      const webhookData = {
        payment_id: paymentId,
        status: paymentData.status,
        cpf: paymentData.payer?.identification?.number || '',
        telefone: paymentData.payer?.phone ? 
          `${paymentData.payer.phone.area_code}${paymentData.payer.phone.number}` : '',
        email: paymentData.payer?.email || '',
        valor: paymentData.transaction_amount || 0,
        timestamp: new Date().toISOString()
      };
      
      // Enviar para webhook externo (não espera resposta)
      fetch('https://webhook.cursoentropia.com/webhook/PAGAMENTOSVIR2025', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      }).catch(err => console.error('Erro ao enviar webhook externo:', err));
    }
    
  } catch (error) {
    console.error('💥 Erro no processamento:', error);
  }
}