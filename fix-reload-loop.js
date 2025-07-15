const fs = require('fs');

console.log('🔧 Corrigindo loop de atualização...\n');

// 1. Remover meta tags de no-cache que podem causar reload infinito
const indexPath = 'client/public/index.html';
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Remover meta tags problemáticas
indexContent = indexContent.replace(/<meta http-equiv="cache-control".*?\/>/g, '');
indexContent = indexContent.replace(/<meta http-equiv="pragma".*?\/>/g, '');
indexContent = indexContent.replace(/<meta http-equiv="expires".*?\/>/g, '');

fs.writeFileSync(indexPath, indexContent);
console.log('✅ Removidas meta tags de no-cache');

// 2. Verificar se tem algum código de reload automático
const adminPath = 'client/src/pages/Admin.js';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Remover qualquer window.location.reload automático
if (adminContent.includes('window.location.reload')) {
  console.log('⚠️  Encontrado reload automático no Admin.js');
  // Remover apenas reloads automáticos, manter os manuais (com botão)
  adminContent = adminContent.replace(/window\.location\.reload\(true\);/g, (match, offset) => {
    // Verificar se é parte de uma função de botão
    const before = adminContent.substring(offset - 100, offset);
    if (before.includes('onClick') || before.includes('limparCache')) {
      return match; // Manter se for de botão
    }
    return '// ' + match; // Comentar se for automático
  });
  fs.writeFileSync(adminPath, adminContent);
}

// 3. Simplificar o Service Worker para não causar loops
const serverPath = 'server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

const simpleServiceWorker = `
const CACHE_NAME = 'massas-ve-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Apenas passa as requisições, sem cache complexo
  event.respondWith(fetch(event.request));
});`;

// Atualizar o service worker
serverContent = serverContent.replace(
  /const CACHE_NAME = [\s\S]*?}\);`/,
  `${simpleServiceWorker}\``
);

fs.writeFileSync(serverPath, serverContent);
console.log('✅ Service Worker simplificado');

// 4. Remover middleware de no-cache se existir
serverContent = serverContent.replace(
  /\/\/ Middleware para prevenir cache nas rotas da API[\s\S]*?next\(\);\s*\}\);/g,
  ''
);

fs.writeFileSync(serverPath, serverContent);

console.log('\n✅ Loop de atualização corrigido!');
console.log('\n🚀 Próximos passos:');
console.log('1. git add .');
console.log('2. git commit -m "Fix reload loop"');
console.log('3. git push');
console.log('\n💡 A página não deve mais ficar recarregando sozinha!');