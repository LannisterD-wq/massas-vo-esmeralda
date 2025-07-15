const fs = require('fs');

console.log('🔧 Removendo Service Worker que está causando crash...\n');

// 1. Remover a rota do service worker do server.js
const serverPath = 'server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Remover a rota /sw.js
serverContent = serverContent.replace(/app\.get\('\/sw\.js'[\s\S]*?\}\);[\s\n]*/g, '');

// Remover também a rota /manifest.json se existir
serverContent = serverContent.replace(/app\.get\('\/manifest\.json'[\s\S]*?\}\);[\s\n]*/g, '');

fs.writeFileSync(serverPath, serverContent);
console.log('✅ Removido service worker do server.js');

// 2. Atualizar index.html para remover o registro do service worker
const indexPath = 'client/public/index.html';
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Remover o script de registro do service worker
indexContent = indexContent.replace(
  /<script>[\s\S]*?if \('serviceWorker' in navigator\)[\s\S]*?<\/script>/g,
  ''
);

// Remover link do manifest também
indexContent = indexContent.replace(
  '<link rel="manifest" href="/manifest.json" />',
  ''
);

fs.writeFileSync(indexPath, indexContent);
console.log('✅ Removido registro do service worker do index.html');

// 3. Criar um server.js mais limpo e estável
console.log('\n📝 Simplificando server.js para evitar crashes...');

// Vamos manter apenas as funcionalidades essenciais
const cleanServerContent = serverContent
  .replace(/\/\/ Servir manifest e service worker[\s\S]*?app\.get\('\/sw\.js'[\s\S]*?\}\);/g, '')
  .replace(/app\.get\('\/manifest\.json'[\s\S]*?\}\);/g, '');

fs.writeFileSync(serverPath, cleanServerContent);

console.log('\n✅ Service Worker removido!');
console.log('\n🚀 Próximos passos:');
console.log('1. git add .');
console.log('2. git commit -m "Remove service worker to fix crash"');
console.log('3. git push');
console.log('\n💡 O sistema funcionará normalmente sem o service worker');
console.log('   (não terá funcionalidade offline, mas não vai crashar)');