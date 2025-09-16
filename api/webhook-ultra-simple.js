// Webhook Mercado Pago - ULTRA SIMPLES - Apenas retorna 200
export default function handler(req, res) {
  // Aceita qualquer método HTTP
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Se for OPTIONS, retorna apenas headers
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Log mínimo
  console.log('Webhook received:', {
    method: req.method,
    id: req.body?.data?.id || req.query?.id || 'no-id',
    timestamp: new Date().toISOString()
  });

  // Retorna 200 IMEDIATAMENTE
  res.status(200).json({ ok: true, method: req.method, timestamp: new Date().toISOString() });
}