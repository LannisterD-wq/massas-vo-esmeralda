const fs = require('fs');
const path = require('path');

console.log('🍝 Criando sistema Massas Vó Esmeralda...\n');

// Criar estrutura de pastas
const folders = [
  'client',
  'client/src',
  'client/src/pages',
  'client/public',
  'uploads',
  'public'
];

folders.forEach(folder => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    console.log(`✅ Pasta criada: ${folder}`);
  }
});

// Arquivos para criar
const files = {
  // Backend files
  'package.json': `{
  "name": "massas-vo-esmeralda",
  "version": "1.0.0",
  "description": "Sistema de Indicações para Massas Vó Esmeralda",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "cd client && npm run build",
    "install-all": "npm install && cd client && npm install"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}`,

  'server.js': `const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

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
  // Tabela unificada de pessoas (indicadores e indicados)
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
      logo_path TEXT
    )
  \`);
});

// Função para gerar código único
function gerarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Rotas API

// Criar nova pessoa (indicador inicial ou através de indicação)
app.post('/api/pessoas', (req, res) => {
  const { nome, telefone, endereco, indicador_codigo } = req.body;
  const codigo = gerarCodigo();
  
  // Se tem indicador_codigo, buscar o ID do indicador
  if (indicador_codigo) {
    db.get(
      'SELECT id FROM pessoas WHERE codigo = ?',
      [indicador_codigo],
      (err, indicador) => {
        if (err || !indicador) {
          res.status(400).json({ error: 'Indicador não encontrado' });
          return;
        }
        
        // Inserir pessoa com indicador
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
              message: 'Cadastro realizado com sucesso! Você também pode indicar amigos com seu link personalizado.'
            });
          }
        );
      }
    );
  } else {
    // Inserir pessoa sem indicador (admin criando)
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

// Listar todas as pessoas com suas indicações
app.get('/api/pessoas', (req, res) => {
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

// Buscar pessoa por código
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

// Atualizar status da pessoa
app.patch('/api/pessoas/:id', (req, res) => {
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

// Upload de logo
app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
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
});`,

  '.env': `PORT=5000
BASE_URL=http://localhost:5000`,

  '.gitignore': `node_modules/
.env
database.db
uploads/
public/
build/
.DS_Store`,

  // Client files
  'client/package.json': `{
  "name": "client",
  "version": "0.1.0",
  "private": true,
  "proxy": "http://localhost:5000",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build && cp -r build/* ../public/",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "devDependencies": {
    "react-scripts": "5.0.1"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}`,

  'client/public/index.html': `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#8B5A3C" />
    <meta name="description" content="Sistema de Indicações - Massas Vó Esmeralda" />
    <title>Massas Vó Esmeralda</title>
  </head>
  <body>
    <noscript>Você precisa habilitar o JavaScript para usar este app.</noscript>
    <div id="root"></div>
  </body>
</html>`,

  'client/src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

  'client/src/App.js': `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './pages/Admin';
import IndicacaoForm from './pages/IndicacaoForm';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Admin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/indicacao/:codigo" element={<IndicacaoForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;`,

  'client/src/App.css': `:root {
  --primary-brown: #8B5A3C;
  --secondary-orange: #D2691E;
  --light-beige: #F5E6D3;
  --dark-brown: #654321;
  --white: #FFFFFF;
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

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  background-color: var(--primary-brown);
  color: var(--white);
  padding: 20px 0;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.logo {
  max-width: 150px;
  margin-bottom: 20px;
}

.card {
  background-color: var(--white);
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: var(--dark-brown);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid var(--light-beige);
  border-radius: 5px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--secondary-orange);
}

.btn {
  background-color: var(--secondary-orange);
  color: var(--white);
  border: none;
  padding: 12px 30px;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn:hover {
  background-color: var(--primary-brown);
}

.btn-whatsapp {
  background-color: #25D366;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.btn-whatsapp:hover {
  background-color: #128C7E;
}

.pessoa-card {
  background-color: #FAFAFA;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
  border: 1px solid #E0E0E0;
}

.pessoa-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.pessoa-info h3 {
  color: var(--primary-brown);
  margin-bottom: 5px;
}

.pessoa-info p {
  margin-bottom: 3px;
  color: #666;
}

.indicador-badge {
  background-color: var(--light-beige);
  color: var(--primary-brown);
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
}

.link-container {
  background-color: #F5F5F5;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  word-break: break-all;
}

.link-text {
  flex: 1;
  font-family: monospace;
  font-size: 14px;
}

.copy-btn {
  background-color: var(--primary-brown);
  color: white;
  border: none;
  padding: 5px 15px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.copy-btn:hover {
  background-color: var(--dark-brown);
}

.status-controls {
  display: flex;
  gap: 15px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #E0E0E0;
}

.status-controls label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 14px;
}

.success-message {
  background-color: #E8F5E9;
  color: #388E3C;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}

.success-message h3 {
  margin-bottom: 10px;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background-color: var(--white);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--secondary-orange);
}

.stat-label {
  color: #666;
  margin-top: 5px;
}

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-bar input {
  flex: 1;
  padding: 10px;
  border: 2px solid var(--light-beige);
  border-radius: 5px;
}

@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .pessoa-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .status-controls {
    flex-wrap: wrap;
  }
  
  .link-container {
    flex-direction: column;
    align-items: stretch;
  }
}`,

  'client/src/pages/Admin.js': `import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Admin() {
  const [pessoas, setPessoas] = useState([]);
  const [novaPessoa, setNovaPessoa] = useState({ nome: '', telefone: '', endereco: '' });
  const [filtro, setFiltro] = useState('');
  const [mensagemCopiado, setMensagemCopiado] = useState('');

  useEffect(() => {
    fetchPessoas();
  }, []);

  const fetchPessoas = async () => {
    try {
      const response = await axios.get('/api/pessoas');
      setPessoas(response.data);
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error);
    }
  };

  const criarPessoa = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/pessoas', novaPessoa);
      alert(\`Pessoa criada! Link: \${response.data.link}\`);
      setNovaPessoa({ nome: '', telefone: '', endereco: '' });
      fetchPessoas();
    } catch (error) {
      console.error('Erro ao criar pessoa:', error);
    }
  };

  const atualizarStatus = async (id, campo, valor) => {
    try {
      await axios.patch(\`/api/pessoas/\${id}\`, { [campo]: valor });
      fetchPessoas();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const copiarLink = (pessoa) => {
    const link = \`\${window.location.origin}/indicacao/\${pessoa.codigo}\`;
    navigator.clipboard.writeText(link);
    setMensagemCopiado(pessoa.id);
    setTimeout(() => setMensagemCopiado(''), 2000);
  };

  const compartilharWhatsApp = (pessoa) => {
    const link = \`\${window.location.origin}/indicacao/\${pessoa.codigo}\`;
    const mensagem = \`Olá \${pessoa.nome}! Aqui está seu link para indicar amigos para experimentar as Massas da Vó Esmeralda: \${link}\`;
    window.open(\`https://wa.me/\${pessoa.telefone}?text=\${encodeURIComponent(mensagem)}\`, '_blank');
  };

  const pessoasFiltradas = pessoas.filter(p => 
    p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    p.telefone.includes(filtro) ||
    p.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  const stats = {
    total: pessoas.length,
    indicacoes: pessoas.filter(p => p.indicado_por).length,
    contactados: pessoas.filter(p => p.contato_realizado).length,
    vendas: pessoas.filter(p => p.comprou).length
  };

  return (
    <div>
      <div className="header">
        <img src="/uploads/logo.png" alt="Massas Vó Esmeralda" className="logo" />
        <h1>Massas Vó Esmeralda - Administração</h1>
      </div>

      <div className="container">
        {/* Estatísticas */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total de Pessoas</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.indicacoes}</div>
            <div className="stat-label">Indicações</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.contactados}</div>
            <div className="stat-label">Contactados</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.vendas}</div>
            <div className="stat-label">Vendas</div>
          </div>
        </div>

        {/* Criar Nova Pessoa */}
        <div className="card">
          <h2>Criar Novo Indicador</h2>
          <form onSubmit={criarPessoa}>
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                value={novaPessoa.nome}
                onChange={(e) => setNovaPessoa({...novaPessoa, nome: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Telefone (WhatsApp)</label>
              <input
                type="text"
                placeholder="11912345678"
                value={novaPessoa.telefone}
                onChange={(e) => setNovaPessoa({...novaPessoa, telefone: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Endereço (opcional)</label>
              <textarea
                rows="2"
                value={novaPessoa.endereco}
                onChange={(e) => setNovaPessoa({...novaPessoa, endereco: e.target.value})}
              />
            </div>
            <button type="submit" className="btn">Criar e Gerar Link</button>
          </form>
        </div>

        {/* Lista de Pessoas */}
        <div className="card">
          <h2>Todas as Pessoas</h2>
          
          <div className="filter-bar">
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou código..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
          </div>

          {pessoasFiltradas.map((pessoa) => (
            <div key={pessoa.id} className="pessoa-card">
              <div className="pessoa-header">
                <div className="pessoa-info">
                  <h3>{pessoa.nome}</h3>
                  <p>📱 {pessoa.telefone}</p>
                  {pessoa.endereco && <p>📍 {pessoa.endereco}</p>}
                  <p>🔗 Código: {pessoa.codigo}</p>
                  {pessoa.indicador_nome && (
                    <p>👤 Indicado por: <span className="indicador-badge">{pessoa.indicador_nome}</span></p>
                  )}
                  {pessoa.total_indicacoes > 0 && (
                    <p>✨ Fez {pessoa.total_indicacoes} indicações</p>
                  )}
                </div>
              </div>

              <div className="link-container">
                <span className="link-text">{window.location.origin}/indicacao/{pessoa.codigo}</span>
                <button 
                  className="copy-btn" 
                  onClick={() => copiarLink(pessoa)}
                >
                  {mensagemCopiado === pessoa.id ? '✓ Copiado!' : 'Copiar'}
                </button>
                <button 
                  className="btn btn-whatsapp" 
                  onClick={() => compartilharWhatsApp(pessoa)}
                  style={{ padding: '5px 15px', fontSize: '14px' }}
                >
                  WhatsApp
                </button>
              </div>

              <div className="status-controls">
                <label>
                  <input
                    type="checkbox"
                    checked={pessoa.contato_realizado}
                    onChange={(e) => atualizarStatus(pessoa.id, 'contato_realizado', e.target.checked)}
                  />
                  Contactado
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={pessoa.prova_entregue}
                    onChange={(e) => atualizarStatus(pessoa.id, 'prova_entregue', e.target.checked)}
                  />
                  Prova Entregue
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={pessoa.comprou}
                    onChange={(e) => atualizarStatus(pessoa.id, 'comprou', e.target.checked)}
                  />
                  Comprou
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Admin;`,

  'client/src/pages/IndicacaoForm.js': `import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function IndicacaoForm() {
  const { codigo } = useParams();
  const [indicador, setIndicador] = useState(null);
  const [formData, setFormData] = useState({ nome: '', telefone: '', endereco: '' });
  const [sucesso, setSucesso] = useState(false);
  const [novoLink, setNovoLink] = useState('');

  useEffect(() => {
    fetchIndicador();
  }, [codigo]);

  const fetchIndicador = async () => {
    try {
      const response = await axios.get(\`/api/pessoa/\${codigo}\`);
      setIndicador(response.data);
    } catch (error) {
      console.error('Erro ao buscar indicador:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/pessoas', {
        ...formData,
        indicador_codigo: codigo
      });
      setSucesso(true);
      setNovoLink(response.data.link);
      setFormData({ nome: '', telefone: '', endereco: '' });
    } catch (error) {
      console.error('Erro ao enviar indicação:', error);
      alert('Erro ao enviar indicação. Tente novamente.');
    }
  };

  const compartilharWhatsApp = () => {
    const mensagem = \`Oi! Acabei de me cadastrar para experimentar as Massas da Vó Esmeralda! 🍝\\n\\nEles dão uma prova grátis - você só paga se gostar!\\n\\nUse meu link para pedir a sua: \${novoLink}\`;
    window.open(\`https://wa.me/?text=\${encodeURIComponent(mensagem)}\`, '_blank');
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(novoLink);
    alert('Link copiado!');
  };

  if (!indicador) {
    return <div className="container">Carregando...</div>;
  }

  return (
    <div>
      <div className="header">
        <img src="/uploads/logo.png" alt="Massas Vó Esmeralda" className="logo" />
        <h1>Massas Vó Esmeralda</h1>
        <p>Sabor de casa feito com carinho!</p>
      </div>

      <div className="container">
        {!sucesso ? (
          <div className="card">
            <h2>Indicação de {indicador.nome}</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Experimente nossas deliciosas massas artesanais! 
              <strong> Você só paga se gostar do sabor.</strong> 😊
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Seu Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Seu Telefone (WhatsApp) *</label>
                <input
                  type="text"
                  placeholder="11912345678"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Endereço para Entrega (opcional)</label>
                <textarea
                  rows="3"
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  placeholder="Rua, número, bairro..."
                />
              </div>

              <button type="submit" className="btn">
                Quero Experimentar Grátis!
              </button>
            </form>
          </div>
        ) : (
          <div className="card">
            <div className="success-message">
              <h3>✅ Cadastro realizado com sucesso!</h3>
              <p>Em breve entraremos em contato pelo WhatsApp para agendar sua prova grátis.</p>
            </div>

            <div style={{ backgroundColor: '#FFF3E0', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ color: '#F57C00', marginBottom: '10px' }}>
                🎁 Ganhe massas grátis indicando amigos!
              </h3>
              <p>Compartilhe seu link personalizado e ganhe recompensas!</p>
            </div>

            <div>
              <h3>Seu Link de Indicação:</h3>
              <div className="link-container">
                <span className="link-text">{novoLink}</span>
                <button className="copy-btn" onClick={copiarLink}>
                  Copiar Link
                </button>
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button onClick={compartilharWhatsApp} className="btn btn-whatsapp">
                  📱 Compartilhar no WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IndicacaoForm;`
};

// Criar os arquivos
Object.entries(files).forEach(([filename, content]) => {
  const filePath = path.join(process.cwd(), filename);
  fs.writeFileSync(filePath, content);
  console.log(`✅ Arquivo criado: ${filename}`);
});

console.log('\n✅ Sistema criado com sucesso!');
console.log('\n📋 Próximos passos:');
console.log('1. Execute: npm install');
console.log('2. Execute: cd client && npm install');
console.log('3. Volte para a pasta raiz: cd ..');
console.log('4. Para rodar o sistema:');
console.log('   - Terminal 1: npm run dev');
console.log('   - Terminal 2: cd client && npm start');
console.log('\n🌐 Acesse: http://localhost:3000/admin');
console.log('\n💡 Dica: Adicione uma imagem logo.png na pasta uploads/');
