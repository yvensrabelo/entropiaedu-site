# 📦 Guia de Transferência do Projeto

## Passo 1: Preparar Nova Conta GitHub
1. Crie uma nova conta no GitHub (se ainda não tiver)
2. Gere um Personal Access Token:
   - Settings > Developer settings > Personal access tokens
   - Generate new token (classic)
   - Selecione: repo, workflow, admin:org

## Passo 2: Copiar o Projeto

### Opção A: Fork (mais simples)
1. Acesse o repositório original
2. Clique em "Fork"
3. Selecione sua nova conta

### Opção B: Clonar e Criar Novo (recomendado)
```bash
# 1. Clone o projeto atual
git clone https://github.com/yvensrabelo/entropiaedu-site.git novo-projeto
cd novo-projeto

# 2. Remova o histórico do Git
rm -rf .git

# 3. Inicialize novo repositório
git init
git add .
git commit -m "Initial commit"

# 4. Crie novo repositório no GitHub (na nova conta)
# Depois conecte:
git remote add origin https://github.com/NOVA_CONTA/NOVO_REPO.git
git branch -M main
git push -u origin main
```

## Passo 3: Configurar Mercado Pago

### Criar Nova Aplicação
1. Acesse [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. Faça login com a conta desejada
3. Crie nova aplicação
4. Copie o **Access Token de Produção**

### Configurar Webhooks no Mercado Pago
1. Na sua aplicação, vá em "Webhooks"
2. Adicione a URL: `https://SEU_DOMINIO/api/webhook`
3. Selecione o evento: "Pagamentos"
4. Salve a configuração

## Passo 4: Deploy na Vercel

### Criar Conta Vercel (se necessário)
1. Acesse [vercel.com](https://vercel.com)
2. Crie conta com GitHub (use a nova conta)

### Importar Projeto
1. Click em "New Project"
2. Import Git Repository
3. Selecione o novo repositório
4. Configure as variáveis de ambiente:
   - `MERCADOPAGO_ACCESS_TOKEN`: Token do passo 3

### Configurar Domínio (opcional)
1. Settings > Domains
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções

## Passo 5: Personalizar o Projeto

### Executar Script de Setup
```bash
node setup.js
```

### Personalização Manual
1. Edite `index.html`:
   - Nome da empresa
   - Produtos/cursos
   - Cores e estilos

2. Edite `api/webhook.js` (se usar webhook externo):
   - URL do seu N8N/Zapier/etc

3. Ajuste `api/create-preference.js`:
   - URLs de retorno
   - Descrições dos produtos

## Passo 6: Testar

### 1. Verificar Token
```
https://SEU_DOMINIO/api/debug-mp
```

### 2. Fazer Pagamento Teste
- Acesse o site
- Clique em comprar
- Complete o pagamento

### 3. Verificar Webhook
```
https://SEU_DOMINIO/api/test-payment?id=PAYMENT_ID
```

## 🔐 Segurança

### Importante:
- **NUNCA** commite credenciais no código
- Use sempre variáveis de ambiente
- Mantenha o `.gitignore` atualizado
- Revise o código antes de fazer deploy

### Checklist de Segurança:
- [ ] Access Token está em variável de ambiente
- [ ] Não há URLs hardcoded sensíveis
- [ ] Webhook valida origem (se necessário)
- [ ] HTTPS está habilitado

## 🆘 Troubleshooting

### Erro 502 no Webhook
- Verifique o Access Token
- Confirme que o domínio está correto
- Use `/api/webhook-debug` para investigar

### Pagamento não confirmado
- Verifique logs na Vercel
- Teste o Payment ID com `/api/test-payment`
- Confirme webhook no painel do MP

### DNS não propaga
- Use domínio `.vercel.app` temporariamente
- Aguarde 24-48h para propagação completa
- Verifique configuração DNS

## 📞 Suporte
- Mercado Pago: [developers.mercadopago.com](https://www.mercadopago.com.br/developers)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- GitHub: [docs.github.com](https://docs.github.com)