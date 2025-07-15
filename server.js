const express = require('express');
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
app.use('/logo.png', express.static(path.join(__dirname, 'uploads/logo.png')));
app.use('/uploads', express.static('uploads'));

// Servir manifest e service worker
});

res.type('application/javascript');
  res.send(`const CACHE_NAME = 'massas-ve-v1752619045065';
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
});`);
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
`);
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
  db.run(`
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
  `);

  // Tabela de configurações
  db.run(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY,
      logo_path TEXT,
      admin_user TEXT DEFAULT 'caetano',
      admin_pass TEXT DEFAULT 'massas2025'
    )
  `);
  
  // Inserir credenciais padrão
  db.run(`
    INSERT OR IGNORE INTO configuracoes (id, admin_user, admin_pass) 
    VALUES (1, 'caetano', 'massas2025')
  `);
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
};

// Proteger rotas administrativas
app.post('/api/pessoas', (req, res) => {
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
              link: `${process.env.BASE_URL || 'http://localhost:5000'}/indicacao/${codigo}`,
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
          link: `${process.env.BASE_URL || 'http://localhost:5000'}/indicacao/${codigo}`
        });
      }
    );
  }
});

// Proteger outras rotas admin
app.get('/api/pessoas', authMiddleware, (req, res) => {
  db.all(`
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
  `, (err, rows) => {
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
    `UPDATE pessoas SET ${updates.join(', ')} WHERE id = ?`,
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
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`\n🔐 Credenciais padrão:\n   Usuário: caetano\n   Senha: massas2025`);
})
// Middleware para prevenir cache nas rotas da API
app.use('/api/*', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
});

;