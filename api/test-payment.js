// Endpoint para testar busca de pagamento específico
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(200).json({
        success: false,
        error: 'Parâmetro ?id=PAYMENT_ID obrigatório',
        example: '/api/test-payment?id=125810622117'
      });
    }

    const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!ACCESS_TOKEN) {
      return res.status(200).json({
        success: false,
        error: 'ACCESS_TOKEN não configurado'
      });
    }

    console.log(`🔍 Testando busca do pagamento: ${id}`);

    // Buscar pagamento específico
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Resposta API:`, {
      status: response.status,
      statusText: response.statusText
    });

    const responseText = await response.text();

    if (!response.ok) {
      return res.status(200).json({
        success: false,
        payment_id: id,
        api_status: response.status,
        api_response: responseText,
        message: response.status === 404 ? 'Pagamento não encontrado' : 'Erro na API MP'
      });
    }

    const paymentData = JSON.parse(responseText);

    return res.status(200).json({
      success: true,
      payment_id: id,
      payment_info: {
        id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        amount: paymentData.transaction_amount,
        currency: paymentData.currency_id,
        payment_method: paymentData.payment_method_id,
        created: paymentData.date_created,
        payer_email: paymentData.payer?.email,
        payer_cpf: paymentData.payer?.identification?.number,
        external_reference: paymentData.external_reference
      },
      full_data: paymentData
    });

  } catch (error) {
    console.error('💥 Erro:', error);

    return res.status(200).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}