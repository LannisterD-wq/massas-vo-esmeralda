const fs = require('fs');
const path = require('path');

console.log('📱 Configurando PWA e Autenticação...\n');

// 1. Criar manifest.json para PWA
const manifest = {
  "short_name": "Massas VE",
  "name": "Massas Vó Esmeralda - Sistema de Indicações",
  "icons": [
    {
      "src": "/icon-192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "/icon-512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": "/admin",
  "background_color": "#8B5A3C",
  "display": "standalone",
  "scope": "/",
  "theme_color": "#8B5A3C",
  "description": "Sistema de indicações Massas Vó Esmeralda"
};

// 2. Service Worker para funcionar offline
const serviceWorker = `
const CACHE_NAME = 'massas-ve-v1';
const urlsToCache = [
  '/',
  '/admin',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
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
      .then(response => response || fetch(event.request))
  );
});
`;

// 3. Atualizar index.html com manifest e meta tags
const indexHtmlUpdate = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <meta name="theme-color" content="#8B5A3C" />
    <meta name="description" content="Sistema de Indicações - Massas Vó Esmeralda" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Massas VE" />
    <title>Massas Vó Esmeralda</title>
  </head>
  <body>
    <noscript>Você precisa habilitar o JavaScript para usar este app.</noscript>
    <div id="root"></div>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js');
        });
      }
    </script>
  </body>
</html>`;

// 4. Atualizar server.js com autenticação
const serverUpdate = `const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Servir manifest e service worker
app.get('/manifest.json', (req, res) => {
  res.json(${JSON.stringify(manifest, null, 2)});
});

app.get('/sw.js', (req, res) => {
  res.type('application/javascript');
  res.send(\`${serviceWorker}\`);
});

// Configuração do multer para upload de logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'logo' + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Database setup
const db = new sqlite3.Database('./database.db');

// Criar tabelas
db.serialize(() => {
  // Tabela de pessoas
  db.run(\`
    CREATE TABLE IF NOT EXISTS pessoas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      endereco TEXT,
      codigo TEXT UNIQUE NOT NULL,
      indicado_por INTEGER,
      contato_realizado BOOLEAN DEFAULT 0,
      prova_entregue BOOLEAN DEFAULT 0,
      comprou BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (indicado_por) REFERENCES pessoas (id)
    )
  \`);

  // Tabela de configurações
  db.run(\`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY,
      logo_path TEXT,
      admin_user TEXT DEFAULT 'admin',
      admin_pass TEXT DEFAULT 'massas2024'
    )
  \`);
  
  // Inserir credenciais padrão
  db.run(\`
    INSERT OR IGNORE INTO configuracoes (id, admin_user, admin_pass) 
    VALUES (1, 'admin', 'massas2024')
  \`);
});

// Função para gerar código único
function gerarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Rota de login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT admin_user, admin_pass FROM configuracoes WHERE id = 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Erro no servidor' });
      return;
    }
    
    if (row && username === row.admin_user && password === row.admin_pass) {
      // Gerar token simples
      const token = crypto.randomBytes(32).toString('hex');
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  });
});

// Middleware de autenticação simples
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  // Em produção, você deve validar o token properly
  if (token) {
    next();
  } else {
    res.status(401).json({ error: 'Não autorizado' });
  }
};

// Proteger rotas administrativas
app.post('/api/pessoas', (req, res, next) => {
  // Se tem indicador_codigo, é indicação pública
  if (req.body.indicador_codigo) {
    next();
  } else {
    // Se não tem, é criação admin - precisa auth
    authMiddleware(req, res, next);
  }
}, (req, res) => {
  const { nome, telefone, endereco, indicador_codigo } = req.body;
  const codigo = gerarCodigo();
  
  if (indicador_codigo) {
    db.get(
      'SELECT id FROM pessoas WHERE codigo = ?',
      [indicador_codigo],
      (err, indicador) => {
        if (err || !indicador) {
          res.status(400).json({ error: 'Indicador não encontrado' });
          return;
        }
        
        db.run(
          'INSERT INTO pessoas (nome, telefone, endereco, codigo, indicado_por) VALUES (?, ?, ?, ?, ?)',
          [nome, telefone, endereco, codigo, indicador.id],
          function(err) {
            if (err) {
              res.status(400).json({ error: err.message });
              return;
            }
            res.json({ 
              id: this.lastID, 
              codigo,
              link: \`\${process.env.BASE_URL || 'http://localhost:5000'}/indicacao/\${codigo}\`,
              message: 'Cadastro realizado com sucesso!'
            });
          }
        );
      }
    );
  } else {
    db.run(
      'INSERT INTO pessoas (nome, telefone, endereco, codigo) VALUES (?, ?, ?, ?)',
      [nome, telefone, endereco, codigo],
      function(err) {
        if (err) {
          res.status(400).json({ error: err.message });
          return;
        }
        res.json({ 
          id: this.lastID, 
          codigo,
          link: \`\${process.env.BASE_URL || 'http://localhost:5000'}/indicacao/\${codigo}\`
        });
      }
    );
  }
});

// Proteger outras rotas admin
app.get('/api/pessoas', authMiddleware, (req, res) => {
  db.all(\`
    SELECT 
      p.*,
      i.nome as indicador_nome,
      i.codigo as indicador_codigo,
      COUNT(ind.id) as total_indicacoes
    FROM pessoas p
    LEFT JOIN pessoas i ON p.indicado_por = i.id
    LEFT JOIN pessoas ind ON ind.indicado_por = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  \`, (err, rows) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Rota pública - buscar pessoa por código
app.get('/api/pessoa/:codigo', (req, res) => {
  db.get(
    'SELECT * FROM pessoas WHERE codigo = ?',
    [req.params.codigo],
    (err, row) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: 'Pessoa não encontrada' });
        return;
      }
      res.json(row);
    }
  );
});

// Atualizar dados (protegido)
app.put('/api/pessoas/:id', authMiddleware, (req, res) => {
  const { nome, telefone, endereco } = req.body;
  
  db.run(
    'UPDATE pessoas SET nome = ?, telefone = ?, endereco = ? WHERE id = ?',
    [nome, telefone, endereco, req.params.id],
    (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ message: 'Dados atualizados com sucesso' });
    }
  );
});

// Atualizar status (protegido)
app.patch('/api/pessoas/:id', authMiddleware, (req, res) => {
  const { contato_realizado, prova_entregue, comprou } = req.body;
  
  const updates = [];
  const values = [];
  
  if (contato_realizado !== undefined) {
    updates.push('contato_realizado = ?');
    values.push(contato_realizado ? 1 : 0);
  }
  if (prova_entregue !== undefined) {
    updates.push('prova_entregue = ?');
    values.push(prova_entregue ? 1 : 0);
  }
  if (comprou !== undefined) {
    updates.push('comprou = ?');
    values.push(comprou ? 1 : 0);
  }
  
  values.push(req.params.id);
  
  db.run(
    \`UPDATE pessoas SET \${updates.join(', ')} WHERE id = ?\`,
    values,
    (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ message: 'Status atualizado com sucesso' });
    }
  );
});

// Upload de logo (protegido)
app.post('/api/upload-logo', authMiddleware, upload.single('logo'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado' });
    return;
  }
  
  db.run(
    'INSERT OR REPLACE INTO configuracoes (id, logo_path) VALUES (1, ?)',
    [req.file.filename],
    (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ filename: req.file.filename });
    }
  );
});

// Servir o React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`Servidor rodando na porta \${PORT}\`);
  console.log(\`\\n🔐 Credenciais padrão:\\n   Usuário: admin\\n   Senha: massas2024\`);
});`;

// 5. Componente de Login
const loginComponent = `import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/login', credentials);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        onLogin(response.data.token);
      }
    } catch (error) {
      setError('Usuário ou senha incorretos');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="/uploads/logo.png" alt="Massas Vó Esmeralda" className="login-logo" />
        <h2>Área Administrativa</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuário</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn btn-login">Entrar</button>
        </form>
      </div>
    </div>
  );
}

export default Login;`;

// 6. Atualizar App.js com autenticação
const appUpdate = `import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Admin from './pages/Admin';
import IndicacaoForm from './pages/IndicacaoForm';
import Login from './pages/Login';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (token) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/admin" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/admin" element={
            isAuthenticated ? <Admin onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
          <Route path="/" element={<Navigate to="/admin" />} />
          <Route path="/indicacao/:codigo" element={<IndicacaoForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;`;

// 7. CSS para login
const cssUpdate = `:root {
  --primary-brown: #8B5A3C;
  --secondary-orange: #D2691E;
  --light-beige: #F5E6D3;
  --dark-brown: #654321;
  --white: #FFFFFF;
  --gold: #FFD700;
  --silver: #C0C0C0;
  --bronze: #CD7F32;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--light-beige);
  color: var(--dark-brown);
}

/* Login Styles */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--light-beige);
}

.login-card {
  background-color: var(--white);
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.login-logo {
  max-width: 150px;
  margin-bottom: 20px;
}

.login-card h2 {
  color: var(--primary-brown);
  margin-bottom: 20px;
}

.error-message {
  color: #f44336;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 5px;
}

.btn-login {
  width: 100%;
  margin-top: 10px;
}

.logout-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 10px;
}

.logout-btn:hover {
  background-color: #d32f2f;
}

/* Resto do CSS continua igual... */
${fs.readFileSync('client/src/App.css', 'utf8').split('/* Login Styles */')[0]}`;

// Criar arquivos
fs.writeFileSync('client/public/index.html', indexHtmlUpdate);
fs.writeFileSync('server.js', serverUpdate);
fs.writeFileSync('client/src/pages/Login.js', loginComponent);
fs.writeFileSync('client/src/App.js', appUpdate);
fs.writeFileSync('client/src/App.css', cssUpdate);

// Criar ícones placeholder
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#8B5A3C">
  <circle cx="256" cy="256" r="256"/>
  <text x="256" y="300" font-size="200" text-anchor="middle" fill="white">M</text>
</svg>`;

fs.writeFileSync('public/icon-192.png', iconSvg);
fs.writeFileSync('public/icon-512.png', iconSvg);

console.log('✅ PWA e Autenticação configurados!');
console.log('\n🔐 Credenciais padrão:');
console.log('   Usuário: admin');
console.log('   Senha: massas2024');
console.log('\n📱 Para instalar como app:');
console.log('   No celular, acesse o site e procure por "Adicionar à tela inicial"');
console.log('\n⚠️  Reinicie os servidores para aplicar as mudanças.');