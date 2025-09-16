# 🎓 Entropia Edu - Site de Testes Mercado Pago

Site básico para testar integração do Mercado Pago Checkout Pro usando **entropiaedu.com**

## 🚀 Deploy na Vercel

### 1. **Preparar Repositório GitHub**

```bash
# Navegar para a pasta do site
cd entropiaedu-site

# Inicializar git
git init

# Adicionar arquivos
git add .

# Primeiro commit
git commit -m "🎉 Site inicial Entropia Edu com Mercado Pago"

# Adicionar repositório remoto (substitua por seu repo)
git remote add origin https://github.com/SEU_USUARIO/entropiaedu-site.git

# Push para GitHub
git push -u origin main
```

### 2. **Conectar com Vercel**

1. Acesse [vercel.com](https://vercel.com)
2. Conecte sua conta GitHub
3. Clique em "Import Project"
4. Selecione o repositório `entropiaedu-site`
5. Configure as variáveis de ambiente

### 3. **Configurar Domínio Personalizado**

No painel da Vercel:
1. Vá em **Settings > Domains**
2. Adicione `entropiaedu.com`
3. Configure DNS na HostGator:
   ```
   Tipo: CNAME
   Nome: www
   Valor: cname.vercel-dns.com
   
   Tipo: A
   Nome: @
   Valor: 76.76.19.61
   ```

### 4. **Configurar Variáveis de Ambiente**

No painel da Vercel, vá em **Settings > Environment Variables**:

```
MERCADOPAGO_WEBHOOK_SECRET = sua_secret_key_do_painel_mp
```

### 5. **Configurar Webhook no Mercado Pago**

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Selecione sua aplicação
3. Vá em **Webhooks**
4. Configure:
   - **URL**: `https://entropiaedu.com/api/webhook`
   - **Eventos**: `Payments`
5. Copie a **Secret Key** e adicione na Vercel

## 🛠 Estrutura do Projeto

```
entropiaedu-site/
├── api/
│   ├── create-preference.js    # API para criar preferências
│   └── webhook.js              # Webhook para notificações
├── pagamento/
│   ├── sucesso.html           # Página de sucesso
│   ├── falha.html             # Página de falha
│   └── pendente.html          # Página de pendente
├── index.html                 # Página principal
├── package.json              # Dependências
├── vercel.json               # Configuração Vercel
└── README.md                 # Este arquivo
```

## 💳 Credenciais Configuradas

- **Public Key**: `APP_USR-722124b2-d75f-4a39-8688-fffae5fb1054`
- **Access Token**: Configurado no código
- **Environment**: Produção

## 🧪 Como Testar

### **Teste Local:**
```bash
# Instalar Vercel CLI
npm install -g vercel

# Instalar dependências
npm install

# Executar localmente
vercel dev
```

### **Teste em Produção:**
1. Acesse `https://entropiaedu.com`
2. Clique em "Comprar Agora" em qualquer curso
3. Use cartões de teste:
   - **Aprovado**: `5031433215406351` (nome: APRO)
   - **Rejeitado**: `5031433215406351` (nome: FUND)

## 🔧 URLs Configuradas

- **Site**: `https://entropiaedu.com`
- **Sucesso**: `https://entropiaedu.com/pagamento/sucesso`
- **Falha**: `https://entropiaedu.com/pagamento/falha`
- **Pendente**: `https://entropiaedu.com/pagamento/pendente`
- **Webhook**: `https://entropiaedu.com/api/webhook`

## 📋 Checklist de Deploy

- [ ] Repositório criado no GitHub
- [ ] Projeto importado na Vercel
- [ ] Domínio `entropiaedu.com` configurado
- [ ] DNS configurado na HostGator
- [ ] Variável `MERCADOPAGO_WEBHOOK_SECRET` configurada
- [ ] Webhook configurado no painel Mercado Pago
- [ ] Teste de pagamento realizado
- [ ] SSL certificado ativo

## 🆘 Troubleshooting

### **Erro 404 nas APIs:**
- Verifique se `vercel.json` está configurado
- Confirme se as funções estão na pasta `api/`

### **Webhook não funciona:**
- Verifique se a Secret Key está configurada
- Confirme se a URL está correta no painel MP
- Verifique logs na Vercel

### **Domínio não funciona:**
- Aguarde propagação DNS (até 24h)
- Verifique configuração na HostGator
- Confirme configuração na Vercel

## 📞 Suporte

- **Email**: contato@entropiaedu.com
- **Documentação MP**: https://www.mercadopago.com.br/developers/
- **Vercel Docs**: https://vercel.com/docs