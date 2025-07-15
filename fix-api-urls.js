const fs = require('fs');
const path = require('path');

console.log('🔧 Corrigindo URLs da API...\n');

// Função para corrigir as URLs em um arquivo
function fixApiUrls(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Adicionar import se não existir
  if (!content.includes("import API_URL from '../config'")) {
    // Encontrar onde adicionar o import (após outros imports)
    const importMatch = content.match(/import .* from .*/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const position = content.indexOf(lastImport) + lastImport.length;
      content = content.slice(0, position) + "\nimport API_URL from '../config';" + content.slice(position);
    } else {
      // Se não houver imports, adicionar no início
      content = "import API_URL from '../config';\n" + content;
    }
  }
  
  // Substituir axios.get('/api/...') por axios.get(`${API_URL}/api/...`)
  content = content.replace(/axios\.(get|post|put|patch|delete)\(['"]\/api\//g, 'axios.$1(`${API_URL}/api/');
  
  // Substituir fetch('/api/...') por fetch(`${API_URL}/api/...`)
  content = content.replace(/fetch\(['"]\/api\//g, 'fetch(`${API_URL}/api/');
  
  // Corrigir as aspas finais para crase
  content = content.replace(/\$\{API_URL\}\/api\/[^'"]*['"]/g, (match) => {
    return match.slice(0, -1) + '`';
  });
  
  // Casos especiais com template literals
  content = content.replace(/\`\/api\/pessoa\/\$\{codigo\}\`/g, '`${API_URL}/api/pessoa/${codigo}`');
  content = content.replace(/\`\/api\/pessoas\/\$\{id\}\`/g, '`${API_URL}/api/pessoas/${id}`');
  
  return content;
}

// Arquivos para corrigir
const files = [
  'client/src/pages/Admin.js',
  'client/src/pages/IndicacaoForm.js',
  'client/src/pages/Login.js'
];

// Processar cada arquivo
files.forEach(file => {
  try {
    const content = fixApiUrls(file);
    fs.writeFileSync(file, content);
    console.log(`✅ Corrigido: ${file}`);
  } catch (error) {
    console.log(`❌ Erro em ${file}: ${error.message}`);
  }
});

console.log('\n✅ URLs da API corrigidas!');
console.log('\n📝 Próximos passos:');
console.log('1. Remova a linha "proxy" do client/package.json');
console.log('2. git add .');
console.log('3. git commit -m "Fix API URLs for production"');
console.log('4. git push');