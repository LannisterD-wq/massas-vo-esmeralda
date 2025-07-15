const fs = require('fs');

console.log('🔧 Configurando cache busting...\n');

// 1. Atualizar o Service Worker para limpar cache antigo
const serviceWorker = `const CACHE_NAME = 'massas-ve-v${Date.now()}';
const urlsToCache = [
  '/',
  '/admin',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Força atualização imediata
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  // Limpa caches antigos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Assume controle imediato
});

self.addEventListener('fetch', event => {
  // Estratégia: Network First (sempre tenta buscar da rede primeiro)
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clona a resposta
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Se falhar, tenta do cache
        return caches.match(event.request);
      })
  );
});`;

// 2. Atualizar server.js para servir o service worker com no-cache
const serverPath = 'server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Atualizar a rota do service worker
const swRoute = `
app.get('/sw.js', (req, res) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.type('application/javascript');
  res.send(\`${serviceWorker}\`);
});`;

serverContent = serverContent.replace(
  /app\.get\('\/sw\.js'[\s\S]*?\}\);/,
  swRoute.trim()
);

// Adicionar headers no-cache para a API
const noCacheMiddleware = `
// Middleware para prevenir cache nas rotas da API
app.use('/api/*', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
});`;

// Adicionar após os outros middlewares
const middlewareIndex = serverContent.indexOf('// Rotas API');
serverContent = serverContent.slice(0, middlewareIndex) + noCacheMiddleware + '\n\n' + serverContent.slice(middlewareIndex);

fs.writeFileSync(serverPath, serverContent);
console.log('✅ Server.js atualizado');

// 3. Adicionar meta tags no index.html
const indexPath = 'client/public/index.html';
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Adicionar meta tags de no-cache se não existirem
if (!indexContent.includes('http-equiv="cache-control"')) {
  const metaTags = `    <meta http-equiv="cache-control" content="no-cache, no-store, must-revalidate" />
    <meta http-equiv="pragma" content="no-cache" />
    <meta http-equiv="expires" content="0" />`;
  
  indexContent = indexContent.replace(
    '<meta name="theme-color" content="#8B5A3C" />',
    `<meta name="theme-color" content="#8B5A3C" />\n${metaTags}`
  );
  
  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ index.html atualizado');
}

// 4. Criar script de limpeza de cache no cliente
const clearCacheScript = `// Adicionar ao Admin.js - função para limpar cache
const limparCache = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      registration.unregister();
    }
  }
  
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
  
  localStorage.clear();
  sessionStorage.clear();
  
  alert('Cache limpo! A página será recarregada.');
  window.location.reload(true);
};`;

console.log('\n✅ Cache busting configurado!');
console.log('\n📝 Adicione este botão no Admin.js se quiser limpeza manual:');
console.log('<button onClick={limparCache} className="btn">Limpar Cache</button>');
console.log('\n🚀 Próximos passos:');
console.log('1. git add .');
console.log('2. git commit -m "Add cache busting"');
console.log('3. git push');
console.log('\n💡 Dicas:');
console.log('- O cache será limpo automaticamente a cada deploy');
console.log('- Use Ctrl+Shift+R (Chrome) ou Cmd+Shift+R (Safari) para forçar atualização');
console.log('- No celular: Configurações do navegador → Limpar dados de navegação');