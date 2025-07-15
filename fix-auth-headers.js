const fs = require('fs');
const path = require('path');

console.log('🔐 Adicionando headers de autorização...\n');

// 1. Corrigir Admin.js
const adminPath = 'client/src/pages/Admin.js';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Adicionar configuração do axios após os imports
const importEndIndex = adminContent.lastIndexOf('import');
const importEndLine = adminContent.indexOf('\n', importEndIndex);
const axiosConfig = `\n\n// Configurar token padrão no axios\nif (localStorage.getItem('token')) {\n  axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');\n}\n`;

if (!adminContent.includes('axios.defaults.headers.common')) {
  adminContent = adminContent.slice(0, importEndLine + 1) + axiosConfig + adminContent.slice(importEndLine + 1);
}

// Adicionar também um botão de logout no Admin.js
if (!adminContent.includes('handleLogout')) {
  // Adicionar função de logout antes do return
  const returnIndex = adminContent.indexOf('return (');
  const logoutFunction = `\n  const handleLogout = () => {\n    localStorage.removeItem('token');\n    window.location.href = '/login';\n  };\n\n`;
  adminContent = adminContent.slice(0, returnIndex) + logoutFunction + adminContent.slice(returnIndex);
  
  // Adicionar botão de logout no header
  adminContent = adminContent.replace(
    '<h1>Massas Vó Esmeralda - Administração</h1>',
    `<h1>Massas Vó Esmeralda - Administração</h1>\n        <button onClick={handleLogout} className="logout-btn">Sair</button>`
  );
}

fs.writeFileSync(adminPath, adminContent);
console.log('✅ Admin.js corrigido');

// 2. Corrigir IndicacaoForm.js - não precisa de auth para indicações públicas
console.log('✅ IndicacaoForm.js não precisa de autenticação (público)');

// 3. Corrigir Login.js para salvar o token corretamente
const loginPath = 'client/src/pages/Login.js';
let loginContent = fs.readFileSync(loginPath, 'utf8');

// Garantir que está salvando o token e redirecionando
loginContent = loginContent.replace(
  'localStorage.setItem(\'token\', response.data.token);\n        onLogin(response.data.token);',
  'localStorage.setItem(\'token\', response.data.token);\n        axios.defaults.headers.common[\'Authorization\'] = response.data.token;\n        onLogin(response.data.token);'
);

fs.writeFileSync(loginPath, loginContent);
console.log('✅ Login.js corrigido');

// 4. Atualizar App.js para verificar autenticação corretamente
const appPath = 'client/src/App.js';
let appContent = fs.readFileSync(appPath, 'utf8');

// Adicionar import do axios se não existir
if (!appContent.includes('import axios')) {
  appContent = appContent.replace(
    "import './App.css';",
    "import './App.css';\nimport axios from 'axios';"
  );
}

// Atualizar useEffect para configurar axios
const useEffectContent = `  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = token;
    }
    setLoading(false);
  }, []);`;

appContent = appContent.replace(
  /useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/,
  useEffectContent
);

fs.writeFileSync(appPath, appContent);
console.log('✅ App.js corrigido');

// 5. Adicionar CSS para o botão de logout
const cssPath = 'client/src/App.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

if (!cssContent.includes('.logout-btn')) {
  cssContent += `\n
/* Botão de Logout */
.logout-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  background-color: #d32f2f;
}

.header {
  position: relative;
}`;
  
  fs.writeFileSync(cssPath, cssContent);
  console.log('✅ CSS atualizado');
}

console.log('\n✅ Headers de autorização configurados!');
console.log('\n📝 Próximos passos:');
console.log('1. git add .');
console.log('2. git commit -m "Add authentication headers"');
console.log('3. git push');
console.log('\n🔐 O sistema agora:');
console.log('- Envia o token em todas as requisições');
console.log('- Tem botão de logout');
console.log('- Redireciona para login se não autorizado');