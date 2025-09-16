# 🚀 Guia Completo de Deploy - Entropia Edu

## 📋 Checklist Pré-Deploy

- [x] ✅ Site criado com Mercado Pago integrado
- [x] ✅ Credenciais de produção configuradas
- [x] ✅ APIs funcionais (create-preference, webhook)
- [x] ✅ Páginas de retorno criadas
- [ ] ⏳ Repositório GitHub criado
- [ ] ⏳ Deploy na Vercel configurado
- [ ] ⏳ Domínio entropiaedu.com configurado
- [ ] ⏳ DNS configurado na HostGator
- [ ] ⏳ Webhook configurado no Mercado Pago

## 🌐 Passo 1: Criar Repositório no GitHub

### 1.1 Criar Repositório
1. Acesse [github.com](https://github.com)
2. Clique em "New repository"
3. Nome: `entropiaedu-site`
4. Descrição: "Site oficial Entropia Edu com integração Mercado Pago"
5. Público ou Privado (sua escolha)
6. ✅ Adicionar README
7. Clique "Create repository"

### 1.2 Subir Código para GitHub
```bash
# Navegue para a pasta do projeto
cd "/Users/yvensrabelo/Downloads/AINDA NO MP/entropiaedu-site"

# Inicializar git
git init

# Adicionar remote origin (SUBSTITUA SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/entropiaedu-site.git

# Adicionar arquivos
git add .

# Primeiro commit
git commit -m "🎉 Site inicial Entropia Edu com Mercado Pago integrado

✅ Funcionalidades implementadas:
- Página principal com cursos
- API para criar preferências 
- Webhook para notificações
- Páginas de retorno (sucesso/falha/pendente)
- Credenciais de produção configuradas

🔧 Tecnologias:
- HTML5, CSS3, Bootstrap 5
- JavaScript vanilla
- Node.js APIs (Vercel Functions)
- Mercado Pago SDK v2.9.0"

# Push para GitHub
git push -u origin main
```

## ☁️ Passo 2: Deploy na Vercel

### 2.1 Conectar GitHub à Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique "Sign up" ou "Log in"
3. Escolha "Continue with GitHub"
4. Autorize a Vercel a acessar seus repositórios

### 2.2 Importar Projeto
1. No dashboard da Vercel, clique "Add New..."
2. Selecione "Project"
3. Encontre `entropiaedu-site` na lista
4. Clique "Import"

### 2.3 Configurar Deploy
1. **Project Name**: `entropiaedu-site`
2. **Framework Preset**: Other
3. **Root Directory**: ./
4. **Build Command**: (deixe vazio)
5. **Output Directory**: (deixe vazio)
6. **Install Command**: npm install

### 2.4 Adicionar Variáveis de Ambiente
**Importante**: Adicione antes do primeiro deploy

1. Clique "Environment Variables"
2. Adicione:
   ```
   Name: MERCADOPAGO_WEBHOOK_SECRET
   Value: (será adicionado após configurar webhook)
   ```
3. Clique "Add"

### 2.5 Fazer Deploy
1. Clique "Deploy"
2. Aguarde 1-2 minutos
3. ✅ Deploy concluído!
4. Anote a URL temporária: `https://entropiaedu-site-xxx.vercel.app`

## 🌍 Passo 3: Configurar Domínio Personalizado

### 3.1 Adicionar Domínio na Vercel
1. No projeto, vá em "Settings"
2. Clique "Domains"
3. Digite: `entropiaedu.com`
4. Clique "Add"
5. Digite: `www.entropiaedu.com`
6. Clique "Add"

### 3.2 Configurar DNS na HostGator

**Acesse o painel da HostGator:**

#### Para o domínio principal (@):
```
Tipo: A
Nome: @
Valor: 76.76.19.61
TTL: 14400
```

#### Para o subdomínio www:
```
Tipo: CNAME  
Nome: www
Valor: cname.vercel-dns.com
TTL: 14400
```

**⏰ Aguarde**: Propagação DNS pode levar até 24 horas

## 🔔 Passo 4: Configurar Webhook no Mercado Pago

### 4.1 Acessar Painel do Mercado Pago
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Faça login com sua conta
3. Selecione sua aplicação

### 4.2 Configurar Webhook
1. No menu lateral, clique "Webhooks"
2. Clique "Configurar webhooks"
3. **URL de notificação**: `https://entropiaedu.com/api/webhook`
4. **Eventos**: Marque "Payments"
5. Clique "Salvar"

### 4.3 Obter Secret Key
1. Após salvar, copie a **Secret Key** gerada
2. Volte para Vercel > Settings > Environment Variables
3. Edite `MERCADOPAGO_WEBHOOK_SECRET`
4. Cole a Secret Key
5. Clique "Save"

### 4.4 Fazer Redeploy
1. Na Vercel, vá em "Deployments"
2. Clique nos 3 pontos do último deploy
3. Clique "Redeploy"
4. ✅ Webhook configurado!

## 🧪 Passo 5: Testar Integração

### 5.1 Teste de Acesso
1. Acesse `https://entropiaedu.com`
2. ✅ Site deve carregar normalmente
3. ✅ Verificar se CSS/JS estão funcionando

### 5.2 Teste de Pagamento Aprovado
1. Clique em "Comprar Agora" em qualquer curso
2. Use cartão de teste:
   ```
   Número: 5031433215406351
   Nome: APRO
   CVV: 123
   Validade: 11/2025
   CPF: 12345678909
   ```
3. ✅ Deve redirecionar para `/pagamento/sucesso`

### 5.3 Teste de Pagamento Rejeitado
1. Repita o processo
2. Use o mesmo cartão mas nome: `FUND`
3. ✅ Deve redirecionar para `/pagamento/falha`

### 5.4 Teste de Webhook
1. Faça um pagamento teste
2. Na Vercel, vá em "Functions"
3. Clique em `api/webhook.js`
4. Verifique logs
5. ✅ Deve mostrar notificação recebida

## 🔧 Passo 6: Monitoramento e Logs

### 6.1 Monitorar Functions
- Vercel Dashboard > Functions
- Verifique logs de `create-preference.js`
- Verifique logs de `webhook.js`

### 6.2 Monitorar Webhooks
- Mercado Pago > Webhooks > Histórico
- Verifique se notificações estão sendo entregues
- Status 200 = Sucesso

### 6.3 Analytics (Opcional)
- Vercel Analytics
- Google Analytics
- Hotjar para UX

## 🚨 Troubleshooting Comum

### ❌ Site não carrega
**Possíveis causas:**
- DNS ainda propagando (aguarde até 24h)
- Configuração DNS incorreta na HostGator
- Domínio não verificado na Vercel

**Soluções:**
1. Verificar configuração DNS
2. Testar com URL temporária da Vercel
3. Aguardar propagação

### ❌ API retorna erro 500
**Possíveis causas:**
- Credenciais incorretas
- Timeout da função
- Erro no código

**Soluções:**
1. Verificar logs na Vercel
2. Testar credenciais localmente
3. Verificar sintaxe do código

### ❌ Webhook não funciona
**Possíveis causas:**
- Secret Key incorreta
- URL do webhook errada
- Função com erro

**Soluções:**
1. Verificar URL: `https://entropiaedu.com/api/webhook`
2. Reconfigurar Secret Key
3. Verificar logs da função

### ❌ Pagamento não processa
**Possíveis causas:**
- Credenciais de teste em produção
- Public Key incorreta no frontend
- Erro na criação de preferência

**Soluções:**
1. Verificar credenciais de produção
2. Verificar Public Key no `index.html`
3. Testar API manualmente

## ✅ Checklist Final

- [ ] Site acessível em `https://entropiaedu.com`
- [ ] HTTPS funcionando (cadeado verde)
- [ ] Pagamento teste aprovado
- [ ] Pagamento teste rejeitado
- [ ] Webhook recebendo notificações
- [ ] Páginas de retorno funcionais
- [ ] Mobile responsive
- [ ] Performance adequada

## 🎉 Parabéns!

Seu site **Entropia Edu** está no ar com:
- ✅ Mercado Pago integrado
- ✅ Pagamentos reais funcionando
- ✅ Domínio personalizado
- ✅ SSL certificado
- ✅ Webhook configurado

**Próximos passos:**
1. Adicionar conteúdo real dos cursos
2. Implementar área de membros
3. Configurar email marketing
4. Adicionar mais métodos de pagamento
5. Implementar analytics

**🚀 Sua loja online está pronta para vender!**