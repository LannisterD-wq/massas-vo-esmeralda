const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo login e logo...\n');

// 1. Atualizar credenciais no servidor
const serverContent = fs.readFileSync('server.js', 'utf8');
const serverFixed = serverContent
  .replace("admin_user TEXT DEFAULT 'admin'", "admin_user TEXT DEFAULT 'caetano'")
  .replace("admin_pass TEXT DEFAULT 'massas2024'", "admin_pass TEXT DEFAULT 'massas2025'")
  .replace("VALUES (1, 'admin', 'massas2024')", "VALUES (1, 'caetano', 'massas2025')")
  .replace("Usuário: admin", "Usuário: caetano")
  .replace("Senha: massas2024", "Senha: massas2025");

fs.writeFileSync('server.js', serverFixed);

// 2. Copiar logo para public se existir
const logoPath = 'uploads/logo.png';
const publicLogoPath = 'public/logo.png';

if (fs.existsSync(logoPath)) {
  // Criar pasta public se não existir
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
  
  // Copiar logo
  fs.copyFileSync(logoPath, publicLogoPath);
  console.log('✅ Logo copiada para public/logo.png');
} else {
  console.log('⚠️  Logo não encontrada em uploads/logo.png');
  console.log('   Coloque uma imagem logo.png na pasta uploads/');
}

// 3. Atualizar referencias da logo nos componentes
const adminContent = fs.readFileSync('client/src/pages/Admin.js', 'utf8');
const adminFixed = adminContent.replace(
  '<img src="/uploads/logo.png"',
  '<img src="/logo.png"'
);
fs.writeFileSync('client/src/pages/Admin.js', adminFixed);

const indicacaoContent = fs.readFileSync('client/src/pages/IndicacaoForm.js', 'utf8');
const indicacaoFixed = indicacaoContent.replace(
  '<img src="/uploads/logo.png"',
  '<img src="/logo.png"'
);
fs.writeFileSync('client/src/pages/IndicacaoForm.js', indicacaoFixed);

const loginContent = fs.readFileSync('client/src/pages/Login.js', 'utf8');
const loginFixed = loginContent.replace(
  '<img src="/uploads/logo.png"',
  '<img src="/logo.png"'
);
fs.writeFileSync('client/src/pages/Login.js', loginFixed);

// 4. Atualizar o server.js para servir a logo corretamente
const serverLogoFix = fs.readFileSync('server.js', 'utf8').replace(
  "app.use(express.static('public'));",
  `app.use(express.static('public'));
app.use('/logo.png', express.static(path.join(__dirname, 'uploads/logo.png')));`
);
fs.writeFileSync('server.js', serverLogoFix);

// 5. Criar script SQL para atualizar banco existente
const updateSQL = `
-- Script para atualizar credenciais no banco existente
UPDATE configuracoes 
SET admin_user = 'caetano', admin_pass = 'massas2025' 
WHERE id = 1;
`;

fs.writeFileSync('update-credentials.sql', updateSQL);

// 6. Script para executar a atualização do banco
const updateDB = `const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

console.log('Atualizando credenciais...');

db.run("UPDATE configuracoes SET admin_user = 'caetano', admin_pass = 'massas2025' WHERE id = 1", (err) => {
  if (err) {
    console.error('Erro:', err);
  } else {
    console.log('✅ Credenciais atualizadas!');
    console.log('   Usuário: caetano');
    console.log('   Senha: massas2025');
  }
  db.close();
});`;

fs.writeFileSync('update-db.js', updateDB);

console.log('✅ Correções aplicadas!');
console.log('\n🔐 Novas credenciais:');
console.log('   Usuário: caetano');
console.log('   Senha: massas2025');
console.log('\n📸 Logo:');
console.log('   Certifique-se que existe um arquivo logo.png na pasta uploads/');
console.log('\n🔄 Execute para atualizar o banco:');
console.log('   node update-db.js');
console.log('\n⚠️  Depois reinicie os servidores!');