const fs = require('fs');

console.log('🔧 Corrigindo botão de reload...\n');

// 1. Verificar se o botão está no App.js
const appPath = 'client/src/App.js';
let appContent = fs.readFileSync(appPath, 'utf8');

// Remover o botão de reload se estiver causando problema
if (appContent.includes('reload-btn')) {
  console.log('🔍 Removendo botão de reload problemático...');
  
  // Remover o botão
  appContent = appContent.replace(
    /{\/\* Botão de Recarregar Global \*\/}[\s\S]*?<\/button>/,
    ''
  );
  
  fs.writeFileSync(appPath, appContent);
  console.log('✅ Botão removido do App.js');
}

// 2. Adicionar um botão de reload mais simples no Admin.js
const adminPath = 'client/src/pages/Admin.js';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Adicionar função de reload se não existir
if (!adminContent.includes('handleReload')) {
  const reloadFunction = `
  const handleReload = () => {
    window.location.reload();
  };
`;

  // Inserir antes do return
  const returnIndex = adminContent.indexOf('return (');
  adminContent = adminContent.slice(0, returnIndex) + reloadFunction + '\n' + adminContent.slice(returnIndex);
  
  // Adicionar botão ao lado do logout
  adminContent = adminContent.replace(
    '<button onClick={handleLogout} className="logout-btn">Sair</button>',
    `<button onClick={handleReload} className="reload-btn-header">🔄</button>
        <button onClick={handleLogout} className="logout-btn">Sair</button>`
  );
  
  fs.writeFileSync(adminPath, adminContent);
  console.log('✅ Botão de reload adicionado ao Admin');
}

// 3. Adicionar CSS para o novo botão
const cssPath = 'client/src/App.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Remover CSS do botão antigo se existir
cssContent = cssContent.replace(/\.reload-btn\s*{[\s\S]*?}/g, '');

// Adicionar CSS do novo botão
if (!cssContent.includes('.reload-btn-header')) {
  const newButtonCSS = `
/* Botão de Reload no Header */
.reload-btn-header {
  position: absolute;
  top: 20px;
  right: 80px;
  background-color: #4CAF50;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s;
}

.reload-btn-header:hover {
  transform: rotate(180deg);
  background-color: #45a049;
}

@media (max-width: 768px) {
  .reload-btn-header {
    right: 70px;
    width: 35px;
    height: 35px;
    font-size: 16px;
  }
}`;

  cssContent += newButtonCSS;
  fs.writeFileSync(cssPath, cssContent);
  console.log('✅ CSS do botão atualizado');
}

// 4. Verificar se há problemas no index.html
const indexPath = 'client/public/index.html';
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Garantir que o index.html está correto
if (!indexContent.includes('<div id="root"></div>')) {
  console.log('❌ Problema no index.html detectado!');
} else {
  console.log('✅ index.html está OK');
}

console.log('\n✅ Botão de reload corrigido!');
console.log('Agora está no header ao lado do botão Sair');
console.log('\n🚀 Comandos:');
console.log('git add .');
console.log('git commit -m "Fix reload button"');
console.log('git push');