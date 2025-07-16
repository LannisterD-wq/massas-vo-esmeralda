const fs = require('fs');

console.log('🚀 Implementando correções com prêmios e tempos corretos...\n');

// 1. Criar página de Receitas com tempo ajustado
const receitasPage = `import React from 'react';
import { useNavigate } from 'react-router-dom';

function Receitas() {
  const navigate = useNavigate();
  
  const receitas = [
    {
      id: 1,
      nome: "Canelone de Presunto e Queijo",
      tempo_forno: "20-25 minutos",
      tempo_microondas: "8-10 minutos",
      preparo: [
        "Forre 1 bandeja com nosso molho",
        "Em seguida posicione os Canelones",
        "Coloque o restante do molho por cima da massa de preferência com 1 colher para melhor distribuição do nosso molho"
      ],
      dica: "Por ser pré-cozido, o tempo de preparo é bem reduzido! Fique de olho para não ressecar."
    }
  ];

  return (
    <div>
      <div className="header">
        <img src="/logo.png" alt="Massas Vó Esmeralda" className="logo" />
        <h1>Receitas - Massas Vó Esmeralda</h1>
        <button onClick={() => navigate(-1)} className="btn-voltar">Voltar</button>
      </div>

      <div className="container">
        {receitas.map(receita => (
          <div key={receita.id} className="card receita-card">
            <h2>{receita.nome}</h2>
            
            <div className="tempo-preparo">
              <div className="tempo-item">
                <span className="tempo-icon">🔥</span>
                <strong>Forno:</strong> 200 graus por {receita.tempo_forno}
              </div>
              <div className="tempo-item">
                <span className="tempo-icon">📡</span>
                <strong>Microondas:</strong> {receita.tempo_microondas}
              </div>
            </div>

            <h3>Modo de Preparo:</h3>
            <ol className="preparo-lista">
              {receita.preparo.map((passo, index) => (
                <li key={index}>{passo}</li>
              ))}
            </ol>

            <div className="dica-box">
              <strong>💡 Dica:</strong> {receita.dica}
            </div>

            <p className="buon-appetito">BUON APPETITO! 🍝</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Receitas;`;

fs.writeFileSync('client/src/pages/Receitas.js', receitasPage);

// 2. Atualizar App.js com nova rota e botão reload
const appPath = 'client/src/App.js';
let appContent = fs.readFileSync(appPath, 'utf8');

// Adicionar import
if (!appContent.includes('import Receitas')) {
  appContent = appContent.replace(
    "import Login from './pages/Login';",
    "import Login from './pages/Login';\nimport Receitas from './pages/Receitas';"
  );
}

// Adicionar rota
if (!appContent.includes('path="/receitas"')) {
  appContent = appContent.replace(
    '</Routes>',
    '  <Route path="/receitas" element={<Receitas />} />\n        </Routes>'
  );
}

// Adicionar botão de reload global
if (!appContent.includes('reload-btn')) {
  const reloadButton = `
      {/* Botão de Recarregar Global */}
      <button 
        onClick={() => window.location.reload()} 
        className="reload-btn"
        title="Recarregar página"
      >
        🔄
      </button>`;

  appContent = appContent.replace(
    '<Routes>',
    reloadButton + '\n        <Routes>'
  );
}

fs.writeFileSync(appPath, appContent);

// 3. Atualizar Admin.js com sistema de prêmios CORRETO
const adminPath = 'client/src/pages/Admin.js';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Adicionar tabela de prêmios após o ranking
const premiosSection = `
        {/* Sistema de Prêmios */}
        {activeTab === 'ranking' && (
          <div className="card premios-card">
            <h2>🎁 Sistema de Prêmios - Campanha +1 Amigo</h2>
            <div className="premios-info">
              <p><strong>Como funciona:</strong></p>
              <ul>
                <li>Apresente 5 amigos que queiram experimentar nossos produtos</li>
                <li>Não cobramos taxa de entrega</li>
                <li>Combo especial: Canelone 500g + Molho Caseiro 350ml por R$ 29,90</li>
                <li><strong>VANTAGEM: SÓ PAGA SE GOSTAR!</strong></li>
              </ul>
              
              <div className="premio-destaque">
                <h3>🏆 A cada 5 indicações que virarem vendas:</h3>
                <div className="premio-lista">
                  <div className="premio-item">
                    <span className="premio-icon">☕</span>
                    <span className="premio-desc">1 Caneca Personalizada Massas Vó Esmeralda</span>
                  </div>
                  <div className="premio-item">
                    <span className="premio-icon">🍷</span>
                    <span className="premio-desc">1 Litro de Vinho da Vó Esmeralda</span>
                  </div>
                  <div className="premio-item">
                    <span className="premio-icon">🍝</span>
                    <span className="premio-desc">1 Massa Grátis à sua escolha</span>
                  </div>
                </div>
              </div>

              <button onClick={() => window.open('/receitas', '_blank')} className="btn btn-receitas">
                📖 Ver Modo de Preparo
              </button>
            </div>
          </div>
        )}`;

// Verificar se já existe a seção de prêmios
if (!adminContent.includes('Sistema de Prêmios')) {
  // Inserir após o card de ranking
  adminContent = adminContent.replace(
    '{activeTab === \'ranking\' && (',
    '{activeTab === \'ranking\' && (\n          <>' 
  );

  adminContent = adminContent.replace(
    '</div>\n        )}',
    '</div>' + premiosSection + '\n          </>\n        )}'
  );
}

fs.writeFileSync(adminPath, adminContent);

// 4. Atualizar CSS com novos estilos
const cssPath = 'client/src/App.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Adicionar novos estilos se não existirem
if (!cssContent.includes('.reload-btn')) {
  const newStyles = `
/* Botão de Reload Global */
.reload-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: var(--secondary-orange);
  color: white;
  border: none;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  z-index: 1000;
  transition: transform 0.2s;
}

.reload-btn:hover {
  transform: rotate(180deg);
  background-color: var(--primary-brown);
}

/* Botão Voltar */
.btn-voltar {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(255,255,255,0.2);
  color: white;
  border: 1px solid white;
  padding: 8px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.btn-voltar:hover {
  background-color: rgba(255,255,255,0.3);
}

/* Receitas Styles */
.receita-card {
  max-width: 800px;
  margin: 0 auto;
}

.tempo-preparo {
  display: flex;
  gap: 30px;
  margin: 20px 0;
  padding: 20px;
  background-color: var(--light-beige);
  border-radius: 8px;
}

.tempo-item {
  flex: 1;
  text-align: center;
}

.tempo-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 10px;
}

.preparo-lista {
  margin: 20px 0;
  padding-left: 20px;
}

.preparo-lista li {
  margin-bottom: 15px;
  line-height: 1.6;
}

.dica-box {
  background-color: #FFF3E0;
  padding: 15px;
  border-radius: 8px;
  margin: 20px 0;
  border-left: 4px solid var(--secondary-orange);
}

.buon-appetito {
  text-align: center;
  font-size: 24px;
  color: var(--primary-brown);
  font-weight: bold;
  margin-top: 30px;
}

/* Prêmios Styles */
.premios-card {
  background-color: #FFF3E0;
  border: 2px solid var(--secondary-orange);
}

.premios-info ul {
  margin: 15px 0;
  padding-left: 20px;
}

.premios-info li {
  margin-bottom: 10px;
}

.premio-destaque {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.premio-destaque h3 {
  color: var(--primary-brown);
  margin-bottom: 20px;
  text-align: center;
}

.premio-lista {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.premio-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background-color: var(--light-beige);
  border-radius: 8px;
}

.premio-icon {
  font-size: 30px;
}

.premio-desc {
  font-size: 16px;
  color: var(--dark-brown);
  font-weight: 500;
}

.btn-receitas {
  margin-top: 20px;
  background-color: #4CAF50;
}

.btn-receitas:hover {
  background-color: #45a049;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .tempo-preparo {
    flex-direction: column;
    gap: 15px;
  }
  
  .premio-item {
    font-size: 14px;
  }
  
  .reload-btn {
    bottom: 70px;
  }
}`;

  cssContent += newStyles;
  fs.writeFileSync(cssPath, cssContent);
}

// 5. Garantir Service Worker estável
const serverPath = 'server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Service Worker minimalista
if (!serverContent.includes('// Service Worker minimalista')) {
  const minimalServiceWorker = `
// Service Worker minimalista
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});`;

  serverContent = serverContent.replace(
    /self\.addEventListener\('install'[\s\S]*?\}\);/g,
    minimalServiceWorker
  );

  fs.writeFileSync(serverPath, serverContent);
}

console.log('✅ Sistema atualizado com prêmios corretos!');
console.log('\n📋 Implementado:');
console.log('- ✅ Prêmios: Caneca + Vinho + Massa a cada 5 vendas');
console.log('- ✅ Tempo de forno ajustado: 20-25 minutos');
console.log('- ✅ Página de receitas completa');
console.log('- ✅ Botão de reload fixo');
console.log('\n🚀 Faça:');
console.log('1. git add .');
console.log('2. git commit -m "Update prizes and cooking times"');
console.log('3. git push');
console.log('\n✨ Agora está perfeito para entregar!');