const fs = require('fs');

console.log('🧹 Removendo botão de reload completamente...\n');

// 1. Limpar App.js
const appPath = 'client/src/App.js';
if (fs.existsSync(appPath)) {
  let appContent = fs.readFileSync(appPath, 'utf8');
  
  // Remover qualquer botão de reload
  appContent = appContent.replace(/{\/\* Botão de Recarregar Global \*\/}[\s\S]*?<\/button>/g, '');
  appContent = appContent.replace(/<button[\s\S]*?reload-btn[\s\S]*?<\/button>/g, '');
  
  fs.writeFileSync(appPath, appContent);
  console.log('✅ App.js limpo');
}

// 2. Limpar Admin.js
const adminPath = 'client/src/pages/Admin.js';
if (fs.existsSync(adminPath)) {
  let adminContent = fs.readFileSync(adminPath, 'utf8');
  
  // Remover função handleReload
  adminContent = adminContent.replace(/const handleReload = \(\) => {[\s\S]*?};/g, '');
  
  // Remover botão reload do header
  adminContent = adminContent.replace(/<button onClick={handleReload}[\s\S]*?<\/button>/g, '');
  adminContent = adminContent.replace(/reload-btn-header/g, '');
  
  fs.writeFileSync(adminPath, adminContent);
  console.log('✅ Admin.js limpo');
}

// 3. Limpar CSS
const cssPath = 'client/src/App.css';
if (fs.existsSync(cssPath)) {
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Remover todos os estilos de reload
  cssContent = cssContent.replace(/\/\* Botão de Reload[\s\S]*?}/gm, '');
  cssContent = cssContent.replace(/\.reload-btn[\s\S]*?}/gm, '');
  cssContent = cssContent.replace(/\.reload-btn-header[\s\S]*?}/gm, '');
  
  // Limpar espaços extras
  cssContent = cssContent.replace(/\n\n\n+/g, '\n\n');
  
  fs.writeFileSync(cssPath, cssContent);
  console.log('✅ CSS limpo');
}

console.log('\n✅ Botão de reload removido completamente!');
console.log('\n🚀 Comandos finais:');
console.log('git add .');
console.log('git commit -m "Remove reload button completely"');
console.log('git push');
console.log('\n💡 Usuários podem usar Ctrl+F5 ou Cmd+Shift+R para recarregar');