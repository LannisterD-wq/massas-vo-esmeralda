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
app.use('/uploads', express.static('uploads'));
app.use('/logo.png', express.static(path.join(__dirname, 'uploads/logo.png')));

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'logo' + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Database
const db = new sqlite3.Database('./database.db');

// Criar tabelas
db.serialize(() => {
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

  db.run(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY,
      logo_path TEXT,
      admin_user TEXT DEFAULT 'caetano',
      admin_pass TEXT DEFAULT 'massas2025'
    )
  `);
  
  db.run(`
    INSERT OR IGNORE INTO configuracoes (id, admin_user, admin_pass) 
    VALUES (1, 'caetano', 'massas2025')
  `);
});

// Funções auxiliares
function gerarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  if (req.body && req.body.indicador_codigo) {
    return next();
  }
  
  const token = req.headers.authorization;
  if (token) {
    next();
  } else {
    res.status(401).json({ error: 'Token não fornecido' });
  }
};

// ROTAS API

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT admin_user, admin_pass FROM configuracoes WHERE id = 1', (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Erro no servidor' });
      return;
    }
    
    if (row && username === row.admin_user && password === row.admin_pass) {
      const token = crypto.randomBytes(32).toString('hex');
      res.json({ success: true, token });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  });
});

// Criar pessoa
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

// Listar pessoas
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

// Atualizar pessoa
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

// Atualizar status
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

// Upload logo
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

// Servir React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📱 Acesse: ${process.env.BASE_URL || 'http://localhost:' + PORT}`);
  console.log(`🔐 Login: caetano / massas2025`);
});