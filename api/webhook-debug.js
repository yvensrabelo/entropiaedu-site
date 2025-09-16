// Endpoint para capturar e debugar exatamente o que o Mercado Pago está enviando
export default async function handler(req, res) {
  // SEMPRE retorna 200 primeiro
  res.status(200);
  res.setHeader('Content-Type', 'application/json');

  try {
    const timestamp = new Date().toISOString();

    console.log('🔍 WEBHOOK DEBUG - Captura completa:', timestamp);
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Query completo:', JSON.stringify(req.query, null, 2));
    console.log('Body completo:', JSON.stringify(req.body, null, 2));

    // Analisar TODOS os possíveis locais de Payment ID
    const possibleIds = {
      'body_data_id': req.body?.data?.id,
      'body_id': req.body?.id,
      'query_id': req.query?.id,
      'query_data_id': req.query?.['data.id'],
      'body_payment_id': req.body?.payment_id,
      'body_resource_id': req.body?.resource_id,
      'headers_x_request_id': req.headers?.['x-request-id'],
      'raw_body': req.body
    };

    console.log('🔎 ANÁLISE DE IDs:', JSON.stringify(possibleIds, null, 2));

    // Se tem algum ID, testar na API
    const idsToTest = Object.values(possibleIds).filter(id =>
      id && typeof id === 'string' && id.length > 0
    );

    if (idsToTest.length > 0) {
      const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

      for (const testId of idsToTest) {
        console.log(`🧪 Testando ID: ${testId}`);

        try {
          const response = await fetch(`https://api.mercadopago.com/v1/payments/${testId}`, {
            headers: {
              'Authorization': `Bearer ${ACCESS_TOKEN}`,
              'Content-Type': 'application/json'
            }
          });

          console.log(`📊 ID ${testId} - Status: ${response.status}`);

          if (response.ok) {
            const paymentData = await response.json();
            console.log(`✅ ID VÁLIDO ENCONTRADO: ${testId}`, {
              id: paymentData.id,
              status: paymentData.status,
              amount: paymentData.transaction_amount
            });
          }
        } catch (error) {
          console.log(`❌ Erro ao testar ID ${testId}:`, error.message);
        }
      }
    }

    return res.json({
      success: true,
      message: 'Debug webhook capturado',
      timestamp: timestamp,
      method: req.method,
      url: req.url,
      query: req.query,
      body: req.body,
      headers: req.headers,
      possible_ids: possibleIds
    });

  } catch (error) {
    console.error('💥 Erro no webhook debug:', error);
    return res.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}