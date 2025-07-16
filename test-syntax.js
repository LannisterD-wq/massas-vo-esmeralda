const fs = require('fs');

// Testar server.js
try {
  require('./server.js');
  console.log('✅ server.js OK');
} catch (error) {
  console.log('❌ Erro no server.js:', error.message);
  console.log('Linha:', error.stack.split('\n')[1]);
}

// Testar Admin.js
try {
  const adminContent = fs.readFileSync('client/src/pages/Admin.js', 'utf8');
  // Verificação básica de sintaxe
  new Function(adminContent.replace(/import.*from.*;/g, '').replace(/export default.*;/g, ''));
  console.log('✅ Admin.js sintaxe OK');
} catch (error) {
  console.log('❌ Erro no Admin.js:', error.message);
}