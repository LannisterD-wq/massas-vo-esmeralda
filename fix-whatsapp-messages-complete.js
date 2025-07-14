const fs = require('fs');
const path = require('path');

console.log('🔧 Aplicando correção completa das mensagens...\n');

// Vamos recriar apenas as funções de compartilhamento
const adminFix = `
  const compartilharWhatsApp = (pessoa) => {
    const link = \`\${window.location.origin}/indicacao/\${pessoa.codigo}\`;
    const telefoneNumero = limparTelefone(pessoa.telefone);
    const telefoneCompleto = telefoneNumero.startsWith('55') ? telefoneNumero : '55' + telefoneNumero;
    
    // Mensagem simples sem formatação especial
    const mensagem = "🍝 Olá " + pessoa.nome + "!\\n\\n" +
      "Aqui está seu link exclusivo para indicar amigos e ganhar prêmios! 🎁\\n\\n" +
      "👉 Seu link: " + link + "\\n\\n" +
      "✨ Como funciona:\\n" +
      "• Compartilhe com amigos e familiares\\n" +
      "• Eles ganham uma prova grátis\\n" +
      "• Você acumula pontos para prêmios!\\n\\n" +
      "📍 Massas Vó Esmeralda\\n" +
      "📞 WhatsApp: (11) 91510-9296\\n" +
      "📸 Instagram: @massasvoesmeralda\\n" +
      "📍 Rua Dentista Barreto, 863 - Vila Carrão\\n\\n" +
      "Quanto mais indicações, mais prêmios você ganha! 🏆";
    
    window.open(\`https://wa.me/\${telefoneCompleto}?text=\${encodeURIComponent(mensagem)}\`, '_blank');
  };
`;

const indicacaoFix = `
  const compartilharWhatsApp = () => {
    // Mensagem simples sem formatação especial
    const mensagem = "🍝 Massas Vó Esmeralda - Prova Grátis!\\n\\n" +
      "Oi! Acabei de me cadastrar para experimentar as deliciosas massas artesanais da Vó Esmeralda! 😋\\n\\n" +
      "Eles oferecem:\\n" +
      "✅ Prova grátis - você só paga se gostar!\\n" +
      "🏠 Entrega na sua casa\\n" +
      "👵 Sabor caseiro de verdade\\n" +
      "🎁 Programa de indicações com prêmios\\n\\n" +
      "Use meu link para pedir sua prova grátis:\\n" +
      "👉 " + novoLink + "\\n\\n" +
      "📍 Onde encontrar:\\n" +
      "📞 WhatsApp: (11) 91510-9296\\n" +
      "📸 Instagram: @massasvoesmeralda\\n" +
      "📍 Rua Dentista Barreto, 863 - Vila Carrão\\n\\n" +
      "Aproveite! É só clicar no link e cadastrar. 🍝✨";
    
    window.open(\`https://wa.me/?text=\${encodeURIComponent(mensagem)}\`, '_blank');
  };
`;

// Ler os arquivos atuais
let adminContent = fs.readFileSync('client/src/pages/Admin.js', 'utf8');
let indicacaoContent = fs.readFileSync('client/src/pages/IndicacaoForm.js', 'utf8');

// Substituir a função compartilharWhatsApp no Admin.js
adminContent = adminContent.replace(
  /const compartilharWhatsApp = \(pessoa\) => \{[\s\S]*?\};/,
  adminFix.trim()
);

// Substituir a função compartilharWhatsApp no IndicacaoForm.js
indicacaoContent = indicacaoContent.replace(
  /const compartilharWhatsApp = \(\) => \{[\s\S]*?\};/,
  indicacaoFix.trim()
);

// Salvar os arquivos
fs.writeFileSync('client/src/pages/Admin.js', adminContent);
fs.writeFileSync('client/src/pages/IndicacaoForm.js', indicacaoContent);

console.log('✅ Correção aplicada com sucesso!');
console.log('\n📱 Mudanças aplicadas:');
console.log('- Usando concatenação de strings em vez de template literals');
console.log('- Mantidos todos os emojis');
console.log('- Quebras de linha com \\\\n');
console.log('- Sem formatação markdown');
console.log('\n⚠️  Reinicie os servidores para ver as mudanças.');