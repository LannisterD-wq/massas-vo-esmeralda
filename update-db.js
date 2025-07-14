const sqlite3 = require('sqlite3').verbose();
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
});