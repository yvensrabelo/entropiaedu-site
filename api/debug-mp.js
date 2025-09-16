// Endpoint de debug para testar ACCESS_TOKEN do Mercado Pago
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

    console.log('🔐 Debug ACCESS_TOKEN:', {
      exists: !!ACCESS_TOKEN,
      length: ACCESS_TOKEN ? ACCESS_TOKEN.length : 0,
      prefix: ACCESS_TOKEN ? ACCESS_TOKEN.substring(0, 25) + '...' : 'N/A'
    });

    if (!ACCESS_TOKEN) {
      return res.status(200).json({
        success: false,
        error: 'ACCESS_TOKEN não configurado'
      });
    }

    // Testar com endpoint básico do MP (buscar informações da conta)
    const response = await fetch('https://api.mercadopago.com/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Resposta API /users/me:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(200).json({
        success: false,
        error: `API Error: ${response.status}`,
        details: errorText,
        token_length: ACCESS_TOKEN.length,
        token_prefix: ACCESS_TOKEN.substring(0, 25) + '...'
      });
    }

    const userData = await response.json();

    return res.status(200).json({
      success: true,
      message: 'ACCESS_TOKEN válido',
      account_info: {
        id: userData.id,
        email: userData.email,
        country: userData.site_id,
        status: userData.status
      },
      token_info: {
        length: ACCESS_TOKEN.length,
        prefix: ACCESS_TOKEN.substring(0, 25) + '...'
      }
    });

  } catch (error) {
    console.error('💥 Erro no debug:', error);

    return res.status(200).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}