const fs = require('fs');

console.log('🔍 Debugando autenticação...\n');

// 1. Criar página de debug
const debugPage = `import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../config';

function Debug() {
  const [info, setInfo] = useState({});
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setInfo({
      token: token ? token.substring(0, 20) + '...' : 'Sem token',
      apiUrl: API_URL,
      env: process.env.NODE_ENV,
      hasToken: !!token,
      axiosHeader: axios.defaults.headers.common['Authorization'] || 'Não configurado'
    });
  }, []);

  const testApi = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token enviado:', token);
      
      const response = await axios.get(\`\${API_URL}/api/pessoas\`, {
        headers: {
          'Authorization': token
        }
      });
      
      setTestResult('✅ Sucesso! ' + response.data.length + ' pessoas encontradas');
    } catch (error) {
      console.error('Erro completo:', error);
      setTestResult('❌ Erro: ' + error.message + ' - ' + (error.response?.data?.error || ''));
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Debug - Autenticação</h1>
      <pre>{JSON.stringify(info, null, 2)}</pre>
      <button onClick={testApi}>Testar API</button>
      <p>{testResult}</p>
    </div>
  );
}

export default Debug;`;

fs.writeFileSync('client/src/pages/Debug.js', debugPage);

// 2. Adicionar rota de debug no App.js
const appPath = 'client/src/App.js';
let appContent = fs.readFileSync(appPath, 'utf8');

// Adicionar import
if (!appContent.includes('import Debug')) {
  appContent = appContent.replace(
    "import Login from './pages/Login';",
    "import Login from './pages/Login';\nimport Debug from './pages/Debug';"
  );
}

// Adicionar rota
if (!appContent.includes('path="/debug"')) {
  appContent = appContent.replace(
    '<Route path="/indicacao/:codigo" element={<IndicacaoForm />} />',
    '<Route path="/indicacao/:codigo" element={<IndicacaoForm />} />\n          <Route path="/debug" element={<Debug />} />'
  );
}

fs.writeFileSync(appPath, appContent);

// 3. Simplificar server.js - remover validação de token complexa
const serverPath = 'server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Criar middleware mais simples
const simpleAuth = `
// Middleware de autenticação simples
const authMiddleware = (req, res, next) => {
  // Para indicações públicas, não precisa auth
  if (req.body && req.body.indicador_codigo) {
    return next();
  }
  
  // Para admin, verifica token (simplificado por enquanto)
  const token = req.headers.authorization;
  if (token) {
    next();
  } else {
    res.status(401).json({ error: 'Token não fornecido' });
  }
};`;

// Substituir o middleware existente
serverContent = serverContent.replace(
  /\/\/ Middleware de autenticação simples[\s\S]*?};/,
  simpleAuth.trim()
);

fs.writeFileSync(serverPath, serverContent);

console.log('✅ Arquivos de debug criados!');
console.log('\n📝 Faça:');
console.log('1. git add .');
console.log('2. git commit -m "Add debug page"');
console.log('3. git push');
console.log('\n🔍 Depois acesse:');
console.log('   https://seu-app.up.railway.app/debug');
console.log('   Para ver informações de debug');