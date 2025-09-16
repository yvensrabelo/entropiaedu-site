# Plataforma de Pagamentos com Mercado Pago

## 🚀 Descrição
Sistema completo de e-commerce com integração ao Mercado Pago Checkout Pro, incluindo:
- Coleta de dados do cliente (CPF, WhatsApp, Email)
- Processamento de pagamentos via PIX, cartão e boleto
- Sistema de webhooks para confirmação de pagamento
- Páginas de retorno (sucesso/falha/pendente)

## 📋 Pré-requisitos
- Node.js 18+
- Conta no Mercado Pago
- Conta na Vercel (para deploy)

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd SEU_REPOSITORIO
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente

#### Na Vercel:
1. Acesse as configurações do projeto
2. Vá em Settings > Environment Variables
3. Adicione:
   - `MERCADOPAGO_ACCESS_TOKEN`: Seu token de produção do Mercado Pago

#### Localmente:
1. Copie o arquivo `.env.example` para `.env.local`
2. Preencha com suas credenciais

## 🏗️ Estrutura do Projeto

```
/
├── api/
│   ├── create-preference.js    # Cria preferências de pagamento
│   ├── webhook.js              # Recebe notificações do MP
│   ├── debug-mp.js            # Debug do token
│   └── test-payment.js        # Testa pagamentos específicos
├── pagamento/
│   ├── sucesso.html           # Página de sucesso
│   ├── falha.html            # Página de falha
│   └── pendente.html         # Página de pendente
├── index.html                 # Página principal
└── vercel.json               # Configuração da Vercel
```

## 🔑 Obter Credenciais do Mercado Pago

1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Crie uma aplicação
3. Copie o **Access Token de Produção**
4. Configure no arquivo `.env` ou nas variáveis da Vercel

## 🌐 Deploy na Vercel

### Via CLI:
```bash
npm i -g vercel
vercel --prod
```

### Via GitHub:
1. Faça push do código para o GitHub
2. Conecte o repositório na Vercel
3. Configure as variáveis de ambiente
4. Deploy automático a cada push

## 🔧 Configurações Importantes

### URLs de Retorno
Edite em `api/create-preference.js`:
```javascript
back_urls: {
  success: 'https://SEU_DOMINIO/pagamento/sucesso',
  failure: 'https://SEU_DOMINIO/pagamento/falha',
  pending: 'https://SEU_DOMINIO/pagamento/pendente'
}
```

### Webhook Externo
Se você usa N8N ou outro sistema, configure em `api/webhook.js`:
```javascript
const webhookResponse = await fetch('https://SEU_WEBHOOK_URL', {
  // ...
});
```

## 📝 Personalização

### Produtos/Cursos
Edite em `index.html` para adicionar/modificar produtos:
```javascript
const cursos = [
  { id: 'novo-curso', titulo: 'Novo Curso', preco: 50.00 }
];
```

### Estilos
O projeto usa Bootstrap 5. Personalize em `index.html`.

## 🧪 Testes

### Testar Token:
```
https://SEU_DOMINIO/api/debug-mp
```

### Testar Pagamento Específico:
```
https://SEU_DOMINIO/api/test-payment?id=PAYMENT_ID
```

## 🐛 Debug

### Webhook com erro 502:
- Verifique se o ACCESS_TOKEN está correto
- Confirme que o domínio está propagado
- Use o endpoint `/api/webhook-debug` temporariamente

### Pagamento não atualiza:
- Verifique as URLs de retorno
- Confirme que o webhook está sendo recebido
- Teste com `/api/test-payment?id=XXX`

## 📚 Documentação Útil
- [Mercado Pago Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing)
- [Webhooks do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

## 📄 Licença
MIT

## 🤝 Suporte
Para dúvidas sobre a integração, consulte a [documentação do Mercado Pago](https://www.mercadopago.com.br/developers).