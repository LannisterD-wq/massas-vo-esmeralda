const fs = require('fs');

console.log('🔧 Corrigindo PWA para funcionar sem crashes...\n');

// 1. Corrigir o server.js com service worker válido
const serverPath = 'server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Service Worker simples e funcional
const workingServiceWorker = `
const CACHE_NAME = 'massas-ve-v1';
const urlsToCache = [
  '/',
  '/admin',
  '/login'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});`;

// Corrigir a rota do service worker
const swRoute = `
app.get('/sw.js', (req, res) => {
  res.type('application/javascript');
  res.send(\`${workingServiceWorker}\`);
});`;

// Se já existe a rota, substituir
if (serverContent.includes("app.get('/sw.js'")) {
  serverContent = serverContent.replace(
    /app\.get\('\/sw\.js'[\s\S]*?\}\);/,
    swRoute.trim()
  );
} else {
  // Se não existe, adicionar antes das outras rotas
  const routesIndex = serverContent.indexOf('// Rotas API');
  serverContent = serverContent.slice(0, routesIndex) + swRoute + '\n\n' + serverContent.slice(routesIndex);
}

// Manifest simples
const manifestRoute = `
app.get('/manifest.json', (req, res) => {
  res.json({
    "short_name": "Massas VE",
    "name": "Massas Vó Esmeralda",
    "icons": [
      {
        "src": "/logo.png",
        "type": "image/png",
        "sizes": "192x192"
      }
    ],
    "start_url": "/admin",
    "background_color": "#8B5A3C",
    "display": "standalone",
    "theme_color": "#8B5A3C"
  });
});`;

// Adicionar rota do manifest se não existir
if (!serverContent.includes("app.get('/manifest.json'")) {
  const swIndex = serverContent.indexOf("app.get('/sw.js'");
  const afterSw = serverContent.indexOf('});', swIndex) + 3;
  serverContent = serverContent.slice(0, afterSw) + '\n' + manifestRoute + serverContent.slice(afterSw);
}

fs.writeFileSync(serverPath, serverContent);
console.log('✅ Server.js corrigido com PWA funcional');

// 2. Garantir que o index.html tem as tags corretas
const indexPath = 'client/public/index.html';
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Se não tem o script de registro, adicionar
if (!indexContent.includes('serviceWorker')) {
  const swScript = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registrado'))
            .catch(err => console.log('SW erro:', err));
        });
      }
    </script>`;
  
  indexContent = indexContent.replace('</body>', swScript + '\n  </body>');
}

// Se não tem o manifest, adicionar
if (!indexContent.includes('manifest.json')) {
  indexContent = indexContent.replace(
    '</head>',
    '    <link rel="manifest" href="/manifest.json" />\n  </head>'
  );
}

fs.writeFileSync(indexPath, indexContent);
console.log('✅ index.html configurado corretamente');

console.log('\n✅ PWA corrigido e funcionando!');
console.log('\n🚀 Próximos passos:');
console.log('1. git add .');
console.log('2. git commit -m "Fix PWA without crash"');
console.log('3. git push');
console.log('\n📱 O app continuará instalável no celular!');