const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo formatação das mensagens WhatsApp...\n');

// Apenas atualizar as mensagens de compartilhamento
const updates = {
  // Corrigir mensagem do Admin
  'client/src/pages/Admin.js': fs.readFileSync('client/src/pages/Admin.js', 'utf8').replace(
    /const mensagem = \`[\s\S]*?\`;[\s\S]*?window\.open/gm,
    `const mensagem = \`🍝 Olá \${pessoa.nome}!

Aqui está seu link exclusivo para indicar amigos e ganhar prêmios! 🎁

👉 Seu link: \${link}

✨ Como funciona:
• Compartilhe com amigos e familiares
• Eles ganham uma prova grátis
• Você acumula pontos para prêmios!

📍 Massas Vó Esmeralda
📞 WhatsApp: (11) 91510-9296
📸 Instagram: @massasvoesmeralda
📍 Rua Dentista Barreto, 863 - Vila Carrão

Quanto mais indicações, mais prêmios você ganha! 🏆\`;
    
    window.open`
  ),

  // Corrigir mensagem do IndicacaoForm
  'client/src/pages/IndicacaoForm.js': fs.readFileSync('client/src/pages/IndicacaoForm.js', 'utf8').replace(
    /const mensagem = \`[\s\S]*?\`;[\s\S]*?window\.open/gm,
    `const mensagem = \`🍝 Massas Vó Esmeralda - Prova Grátis!

Oi! Acabei de me cadastrar para experimentar as deliciosas massas artesanais da Vó Esmeralda! 😋

Eles oferecem:
✅ Prova grátis - você só paga se gostar!
🏠 Entrega na sua casa
👵 Sabor caseiro de verdade
🎁 Programa de indicações com prêmios

Use meu link para pedir sua prova grátis:
👉 \${novoLink}

📍 Onde encontrar:
📞 WhatsApp: (11) 91510-9296
📸 Instagram: @massasvoesmeralda
📍 Rua Dentista Barreto, 863 - Vila Carrão

Aproveite! É só clicar no link e cadastrar. 🍝✨\`;
    
    window.open`
  )
};

// Aplicar as correções
Object.entries(updates).forEach(([filename, content]) => {
  const filePath = path.join(process.cwd(), filename);
  fs.writeFileSync(filePath, content);
  console.log(`✅ Arquivo corrigido: ${filename}`);
});

console.log('\n✅ Formatação corrigida!');
console.log('\n📱 Mudanças:');
console.log('- Removido markdown (asteriscos)');
console.log('- Mantidos todos os emojis');
console.log('- Texto limpo e organizado');
console.log('\n⚠️  Reinicie os servidores para aplicar as mudanças.');