const fs = require('fs');

console.log('🔧 Corrigindo erro de token...\n');

// Verificar o Admin.js linha 4
const adminPath = 'client/src/pages/Admin.js';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// O erro está na linha 4 - provavelmente um caractere invisível ou problema de encoding
// Vamos recriar as primeiras linhas
const correctStart = `import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

// Configurar token padrão no axios
if (localStorage.getItem('token')) {
  axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
}

`;

// Pegar o resto do arquivo a partir da função
const functionStart = adminContent.indexOf('function Admin()');
if (functionStart === -1) {
  console.error('❌ Não encontrou function Admin()');
} else {
  // Reconstruir o arquivo
  const newContent = correctStart + adminContent.substring(functionStart);
  
  // Salvar
  fs.writeFileSync(adminPath, newContent);
  console.log('✅ Corrigido!');
}

// Verificar também se tem BOM (Byte Order Mark) ou caracteres estranhos
const buffer = fs.readFileSync(adminPath);
if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
  console.log('⚠️  Arquivo tem BOM, removendo...');
  const contentWithoutBOM = buffer.toString('utf8').substring(1);
  fs.writeFileSync(adminPath, contentWithoutBOM);
}

console.log('\n🚀 Execute:');
console.log('1. git add .');
console.log('2. git commit -m "Fix unexpected token"');
console.log('3. git push');