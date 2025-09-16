// API para criar preferências de pagamento - Vercel Serverless Function
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Credenciais de produção via variáveis de ambiente (SEGURANÇA)
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

// Verificar se as credenciais estão configuradas
if (!ACCESS_TOKEN) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado nas variáveis de ambiente');
}

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
    const { id, title, price, description, buyer_email, buyer_cpf, buyer_phone } = req.body;

    // Validar dados
    if (!id || !title || !price) {
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios: id, title, price'
      });
    }

    console.log('Criando preferência para:', { id, title, price, buyer_cpf, buyer_phone });

    const preference = new Preference(client);

    // Processar telefone (extrair DDD e número)
    let area_code = '11';
    let phone_number = '999999999';
    if (buyer_phone) {
      const cleanPhone = buyer_phone.replace(/\D/g, '');
      if (cleanPhone.length === 11) {
        area_code = cleanPhone.substring(0, 2);
        phone_number = cleanPhone.substring(2);
      }
    }

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

        // URLs de retorno - usando domínio www.entropiaedu.com (corrigido redirecionamento 307)
        back_urls: {
          success: 'https://www.entropiaedu.com/pagamento/sucesso',
          failure: 'https://www.entropiaedu.com/pagamento/falha',
          pending: 'https://www.entropiaedu.com/pagamento/pendente'
        },
        auto_return: 'approved',

        // Webhook - usando versão funcional que processa e envia
        notification_url: 'https://www.entropiaedu.com/api/webhook-ultra-simple',

        // Dados do comprador
        payer: {
          name: 'Cliente',
          surname: 'Entropia Edu',
          email: buyer_email || 'cliente@entropiaedu.com',
          phone: {
            area_code: area_code,
            number: phone_number
          },
          identification: {
            type: 'CPF',
            number: buyer_cpf || '12345678901'
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