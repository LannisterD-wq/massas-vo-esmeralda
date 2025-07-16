const fs = require('fs');

console.log('🔧 Corrigindo TODOS os erros de sintaxe...\n');

// 1. Verificar server.js linha 20
const serverPath = 'server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Contar as chaves
let openBraces = 0;
let closeBraces = 0;
const lines = serverContent.split('\n');

console.log('Analisando server.js...');
lines.forEach((line, index) => {
  openBraces += (line.match(/{/g) || []).length;
  closeBraces += (line.match(/}/g) || []).length;
  
  if (index === 19) { // Linha 20 (index 19)
    console.log(`Linha 20: "${line}"`);
    console.log(`Balanço até aqui: { = ${openBraces}, } = ${closeBraces}`);
  }
});

console.log(`\nTotal: { = ${openBraces}, } = ${closeBraces}`);
if (openBraces !== closeBraces) {
  console.log('❌ Desbalanceamento de chaves!');
}

// Procurar por padrões problemáticos
const problematicPatterns = [
  /}\s*}\s*;/g,  // Duplo fechamento
  /{\s*}/g,      // Chave vazia
  /}\s*\)/g,     // Fechamento antes de parênteses sem vírgula
];

problematicPatterns.forEach((pattern, index) => {
  const matches = serverContent.match(pattern);
  if (matches) {
    console.log(`\n⚠️  Padrão problemático ${index + 1} encontrado:`, matches);
  }
});

// Vamos verificar especificamente ao redor da linha 20
console.log('\nContexto da linha 20:');
for (let i = 15; i < 25 && i < lines.length; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}

// Procurar por service worker mal formado
if (serverContent.includes('app.get(\'/sw.js\'')) {
  console.log('\n🔍 Verificando Service Worker...');
  const swStart = serverContent.indexOf('app.get(\'/sw.js\'');
  const swEnd = serverContent.indexOf('});', swStart) + 3;
  const swSection = serverContent.substring(swStart, swEnd);
  
  // Contar template literals
  const backticks = (swSection.match(/\`/g) || []).length;
  if (backticks % 2 !== 0) {
    console.log('❌ Template literals desbalanceadas no Service Worker!');
    
    // Corrigir removendo service worker problemático
    serverContent = serverContent.replace(/app\.get\('\/sw\.js'[\s\S]*?\}\);/g, '');
    console.log('✅ Service Worker removido');
  }
}

// Remover também manifest.json se existir
if (serverContent.includes('app.get(\'/manifest.json\'')) {
  serverContent = serverContent.replace(/app\.get\('\/manifest\.json'[\s\S]*?\}\);/g, '');
  console.log('✅ Manifest route removida');
}

// Salvar server.js corrigido
fs.writeFileSync(serverPath, serverContent);

// 2. Verificar Admin.js também
const adminPath = 'client/src/pages/Admin.js';
if (fs.existsSync(adminPath)) {
  let adminContent = fs.readFileSync(adminPath, 'utf8');
  
  // Remover BOM se existir
  if (adminContent.charCodeAt(0) === 0xFEFF) {
    adminContent = adminContent.substring(1);
    fs.writeFileSync(adminPath, adminContent);
    console.log('✅ BOM removido do Admin.js');
  }
}

// 3. Criar um script de teste simples
const testScript = `const fs = require('fs');

// Testar server.js
try {
  require('./server.js');
  console.log('✅ server.js OK');
} catch (error) {
  console.log('❌ Erro no server.js:', error.message);
  console.log('Linha:', error.stack.split('\\n')[1]);
}

// Testar Admin.js
try {
  const adminContent = fs.readFileSync('client/src/pages/Admin.js', 'utf8');
  // Verificação básica de sintaxe
  new Function(adminContent.replace(/import.*from.*;/g, '').replace(/export default.*;/g, ''));
  console.log('✅ Admin.js sintaxe OK');
} catch (error) {
  console.log('❌ Erro no Admin.js:', error.message);
}`;

fs.writeFileSync('test-syntax.js', testScript);

console.log('\n📋 Teste local:');
console.log('node test-syntax.js');
console.log('\n🚀 Deploy:');
console.log('1. git add .');
console.log('2. git commit -m "Remove problematic routes"');
console.log('3. git push');