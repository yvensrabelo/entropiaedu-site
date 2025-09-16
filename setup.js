#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (q) => new Promise((resolve) => rl.question(q, resolve));

async function setup() {
  console.log('🚀 Configuração do Projeto Mercado Pago\n');
  console.log('Este script vai ajudar a configurar seu projeto.\n');

  // Configurações básicas
  const config = {};

  config.siteName = await question('Nome do site (ex: Minha Loja): ');
  config.domain = await question('Domínio do site (ex: minhaloja.com): ');
  config.webhookUrl = await question('URL do webhook externo (opcional, Enter para pular): ');
  
  console.log('\n📝 Atualizando arquivos...\n');

  // Atualizar index.html com o nome do site
  let indexContent = fs.readFileSync('index.html', 'utf8');
  indexContent = indexContent.replace(/Entropia Edu/g, config.siteName);
  indexContent = indexContent.replace(/entropiaedu\.com/g, config.domain);
  fs.writeFileSync('index.html', indexContent);
  console.log('✅ index.html atualizado');

  // Atualizar api/create-preference.js
  let preferenceContent = fs.readFileSync('api/create-preference.js', 'utf8');
  preferenceContent = preferenceContent.replace(/entropiaedu-site\.vercel\.app/g, config.domain);
  preferenceContent = preferenceContent.replace(/entropiaedu\.com/g, config.domain);
  fs.writeFileSync('api/create-preference.js', preferenceContent);
  console.log('✅ api/create-preference.js atualizado');

  // Atualizar webhook se fornecido
  if (config.webhookUrl) {
    let webhookContent = fs.readFileSync('api/webhook.js', 'utf8');
    webhookContent = webhookContent.replace(
      'https://webhook.cursoentropia.com/webhook/PAGAMENTOSVIR2025',
      config.webhookUrl
    );
    fs.writeFileSync('api/webhook.js', webhookContent);
    console.log('✅ api/webhook.js atualizado');
  }

  // Criar arquivo de configuração
  const envContent = `# Configuração do ${config.siteName}
SITE_NAME=${config.siteName}
DOMAIN=${config.domain}
${config.webhookUrl ? `WEBHOOK_URL=${config.webhookUrl}` : '# WEBHOOK_URL='}

# Mercado Pago - Adicione seu token aqui
MERCADOPAGO_ACCESS_TOKEN=
`;

  fs.writeFileSync('.env.local', envContent);
  console.log('✅ .env.local criado');

  console.log('\n✨ Configuração concluída!\n');
  console.log('Próximos passos:');
  console.log('1. Adicione seu MERCADOPAGO_ACCESS_TOKEN no arquivo .env.local');
  console.log('2. Faça deploy na Vercel: vercel --prod');
  console.log('3. Configure as variáveis de ambiente na Vercel');
  console.log('\nBoa sorte com seu projeto! 🎉\n');

  rl.close();
}

setup().catch(console.error);