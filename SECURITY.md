# 🔒 Segurança - Entropia Edu

## ⚠️ ALERTA DE SEGURANÇA CORRIGIDO

**Data**: 16/09/2024  
**Problema**: Credenciais de produção do Mercado Pago expostas no código  
**Status**: ✅ CORRIGIDO  

### 🛠 Correções Implementadas:

1. ✅ **Credenciais removidas do código**
   - Substituídas por variáveis de ambiente
   - `process.env.MERCADOPAGO_ACCESS_TOKEN`

2. ✅ **Validação de segurança adicionada**
   - Verificação se variáveis estão configuradas
   - Erro claro se credenciais faltarem

3. ✅ **.gitignore atualizado**
   - Proteção contra commit de credenciais
   - Arquivos de ambiente bloqueados

4. ✅ **Configuração Vercel**
   - Variáveis de ambiente configuradas
   - Referências seguras (@mercadopago_access_token)

## 🔐 Configuração Segura

### Na Vercel:
```
MERCADOPAGO_ACCESS_TOKEN = [seu_access_token_aqui]
MERCADOPAGO_WEBHOOK_SECRET = [sua_webhook_secret]
```

### Desenvolvimento Local:
```bash
# Copiar arquivo de exemplo
cp .env.example .env.local

# Editar com suas credenciais (nunca commit!)
echo "MERCADOPAGO_ACCESS_TOKEN=SEU_TOKEN_AQUI" > .env.local
```

## 🚨 AÇÃO URGENTE NECESSÁRIA

### Regenerar Credenciais:
1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Vá em "Credenciais"
3. Clique "Regenerar" nas credenciais de produção
4. Atualize na Vercel e desenvolvimento local

### Motivo:
- Credenciais antigas foram expostas publicamente no GitHub
- Podem ter sido coletadas por bots maliciosos
- SEMPRE regenere após exposição

## ✅ Boas Práticas Implementadas

1. **Nunca hardcode credenciais**
2. **Use variáveis de ambiente**
3. **Valide configurações**
4. **Configure .gitignore adequadamente**
5. **Monitore repositórios (Git Guardian)**
6. **Regenere credenciais se expostas**

## 🔍 Monitoramento

- Git Guardian: Monitoramento de credenciais expostas
- Vercel: Logs de função para debug
- Mercado Pago: Logs de webhook e transações

## 📞 Em Caso de Problema

1. **Regenerar credenciais imediatamente**
2. **Verificar logs de transações suspeitas**
3. **Atualizar todas as configurações**
4. **Notificar equipe de segurança**

---

**⚡ Próxima Verificação**: Após deploy, testar com credenciais regeneradas