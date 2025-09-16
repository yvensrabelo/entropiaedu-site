// API para criar preferências de pagamento - Vercel Serverless Function
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Suas credenciais de produção
const ACCESS_TOKEN = 'APP_USR-5258685936517659-091600-6e36353e2b3a1fc71d70b1aaa364ca68-765341328';

// Configurar cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: ACCESS_TOKEN,
  options: {
    timeout: 5000,
    idempotencyKey: 'entropiaedu-' + Date.now()
  }
});

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido' 
    });
  }

  try {
    const { id, title, price, description, buyer_email } = req.body;

    // Validar dados
    if (!id || !title || !price) {
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios: id, title, price'
      });
    }

    console.log('Criando preferência para:', { id, title, price });

    const preference = new Preference(client);

    const preferenceData = {
      body: {
        items: [
          {
            id: id,
            title: title,
            description: description || title,
            category_id: 'education',
            quantity: 1,
            unit_price: Number(price),
            currency_id: 'BRL'
          }
        ],
        
        // URLs de retorno para entropiaedu.com
        back_urls: {
          success: 'https://entropiaedu.com/pagamento/sucesso',
          failure: 'https://entropiaedu.com/pagamento/falha',
          pending: 'https://entropiaedu.com/pagamento/pendente'
        },
        auto_return: 'approved',
        
        // Webhook
        notification_url: 'https://entropiaedu.com/api/webhook',
        
        // Dados do comprador
        payer: {
          name: 'Cliente',
          surname: 'Entropia Edu',
          email: buyer_email || 'cliente@entropiaedu.com',
          phone: {
            area_code: '11',
            number: '999999999'
          },
          identification: {
            type: 'CPF',
            number: '12345678901'
          },
          address: {
            street_name: 'Rua Principal',
            street_number: 123,
            zip_code: '01310-100'
          }
        },
        
        // Configurações
        external_reference: `entropiaedu_${id}_${Date.now()}`,
        statement_descriptor: 'ENTROPIA EDU',
        
        // Métodos de pagamento
        payment_methods: {
          installments: 12,
          default_installments: 1,
          excluded_payment_methods: [],
          excluded_payment_types: []
        },
        
        // Expiração em 24 horas
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    };

    const result = await preference.create(preferenceData);

    console.log('Preferência criada:', result.id);

    return res.status(200).json({
      success: true,
      preference_id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point
    });

  } catch (error) {
    console.error('Erro ao criar preferência:', error);

    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data || null
    });
  }
}