// Webhook Mercado Pago - ULTRA SIMPLES - Apenas retorna 200
export default function handler(req, res) {
  // Log mínimo
  console.log('Webhook received:', req.body?.data?.id || req.query?.id || 'no-id');
  
  // Retorna 200 IMEDIATAMENTE
  res.status(200).json({ ok: true });
}