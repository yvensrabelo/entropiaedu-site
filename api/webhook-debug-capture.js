// Webhook de debug para capturar TODAS as chamadas do Mercado Pago
export default async function handler(req, res) {
  // RETORNA 200 IMEDIATAMENTE
  res.status(200).json({ captured: true });

  try {
    const timestamp = new Date().toISOString();
    console.log('=== WEBHOOK DEBUG CAPTURE ===');
    console.log('Timestamp:', timestamp);
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query:', JSON.stringify(req.query, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('=== END CAPTURE ===');

    // Extrair payment ID
    const paymentId = req.body?.data?.id || req.query?.id;
    
    if (paymentId) {
      console.log(`🔍 Payment ID encontrado: ${paymentId}`);
      
      // Testar busca do pagamento
      const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
      
      if (ACCESS_TOKEN) {
        try {
          const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
              'Authorization': `Bearer ${ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const paymentData = await response.json();
            console.log(`📊 Payment Status: ${paymentData.status}`);
            console.log(`💰 Amount: ${paymentData.transaction_amount}`);
            console.log(`👤 Email: ${paymentData.payer?.email}`);
            
            // Se aprovado, testar envio para webhook externo
            if (paymentData.status === 'approved') {
              console.log('✅ Pagamento APROVADO - tentando enviar para webhook externo...');
              
              const webhookData = {
                payment_id: paymentId,
                status: paymentData.status,
                cpf: paymentData.payer?.identification?.number || '',
                telefone: paymentData.payer?.phone ? 
                  `${paymentData.payer.phone.area_code}${paymentData.payer.phone.number}` : '',
                email: paymentData.payer?.email || '',
                valor: paymentData.transaction_amount || 0,
                timestamp: timestamp,
                debug: true
              };
              
              console.log('📤 Enviando para N8N:', JSON.stringify(webhookData, null, 2));
              
              try {
                const webhookResponse = await fetch('https://webhook.cursoentropia.com/webhook/PAGAMENTOSVIR2025', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(webhookData)
                });
                
                console.log(`🚀 Webhook externo - Status: ${webhookResponse.status}`);
                console.log(`🚀 Webhook externo - Response: ${await webhookResponse.text()}`);
              } catch (webhookError) {
                console.error('❌ Erro ao enviar webhook externo:', webhookError.message);
              }
            }
          } else {
            console.error(`❌ Erro ao buscar pagamento: ${response.status}`);
          }
        } catch (apiError) {
          console.error('❌ Erro na API MP:', apiError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Erro no debug:', error);
  }
}