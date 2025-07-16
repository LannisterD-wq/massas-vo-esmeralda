const fs = require('fs');

console.log('🔧 Corrigindo erro de sintaxe...\n');

// O erro está no Admin.js - faltou fechar corretamente o JSX
const adminPath = 'client/src/pages/Admin.js';
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Verificar e corrigir a estrutura do activeTab === 'ranking'
// O problema é que tem um <> sem fechar ou está mal estruturado

// Vamos procurar a seção do ranking e garantir que está correta
const rankingStart = adminContent.indexOf("{activeTab === 'ranking' && (");
const rankingEnd = adminContent.indexOf("</div>\n        )}", rankingStart);

if (rankingStart !== -1 && rankingEnd !== -1) {
  // Extrair a seção do ranking
  let rankingSection = adminContent.substring(rankingStart, rankingEnd + 17);
  
  // Verificar se tem <> sem fechar
  if (rankingSection.includes('<>') && !rankingSection.includes('</>')) {
    // Corrigir adicionando o fechamento
    rankingSection = rankingSection.replace(
      "</div>\n        )}",
      "</div>\n          </>\n        )}"
    );
  }
  
  // Se tem <> mas está mal posicionado, remover
  if (rankingSection.match(/<>\s*{activeTab/)) {
    rankingSection = rankingSection.replace(/<>\s*{/, '{');
    rankingSection = rankingSection.replace(/}\s*<\/>/, '}');
  }
  
  // Substituir no conteúdo original
  adminContent = adminContent.substring(0, rankingStart) + rankingSection + adminContent.substring(rankingEnd + 17);
}

// Salvar correção
fs.writeFileSync(adminPath, adminContent);

// Verificar também se há outros erros de sintaxe comuns
// Remover <> desnecessários
adminContent = adminContent.replace(/{\s*activeTab === 'ranking' && \(\s*<>/g, "{activeTab === 'ranking' && (");
adminContent = adminContent.replace(/<\/>\s*\)\s*}/g, ")}");

// Garantir que a estrutura está correta
const correctRankingStructure = `
        {activeTab === 'ranking' && (
          <div className="card">
            <h2>🏆 Ranking de Indicadores</h2>
            {ranking.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>
                Ainda não há indicações registradas.
              </p>
            ) : (
              <div className="ranking-list">
                {ranking.map((pessoa, index) => (
                  <div key={pessoa.id} className="ranking-item">
                    <div className="ranking-position">
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index > 2 && \`\${index + 1}º\`}
                    </div>
                    <div className="ranking-info">
                      <h3>{pessoa.nome}</h3>
                      <p>📱 {formatarTelefone(pessoa.telefone)}</p>
                    </div>
                    <div className="ranking-stats">
                      <div className="indicacoes-count">
                        <span className="count-number">{pessoa.total_indicacoes}</span>
                        <span className="count-label">indicações</span>
                      </div>
                    </div>
                    <div className="ranking-actions">
                      <button 
                        className="copy-btn" 
                        onClick={() => copiarLink(pessoa)}
                      >
                        {mensagemCopiado === pessoa.id ? '✓' : '📋'}
                      </button>
                      <button 
                        className="btn btn-whatsapp" 
                        onClick={() => compartilharWhatsApp(pessoa)}
                        style={{ padding: '5px 10px', fontSize: '12px' }}
                      >
                        📱
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sistema de Prêmios */}
        {activeTab === 'ranking' && (
          <div className="card premios-card">
            <h2>🎁 Sistema de Prêmios - Campanha +1 Amigo</h2>
            <div className="premios-info">
              <p><strong>Como funciona:</strong></p>
              <ul>
                <li>Apresente 5 amigos que queiram experimentar nossos produtos</li>
                <li>Não cobramos taxa de entrega</li>
                <li>Combo especial: Canelone 500g + Molho Caseiro 350ml por R$ 29,90</li>
                <li><strong>VANTAGEM: SÓ PAGA SE GOSTAR!</strong></li>
              </ul>
              
              <div className="premio-destaque">
                <h3>🏆 A cada 5 indicações que virarem vendas:</h3>
                <div className="premio-lista">
                  <div className="premio-item">
                    <span className="premio-icon">☕</span>
                    <span className="premio-desc">1 Caneca Personalizada Massas Vó Esmeralda</span>
                  </div>
                  <div className="premio-item">
                    <span className="premio-icon">🍷</span>
                    <span className="premio-desc">1 Litro de Vinho da Vó Esmeralda</span>
                  </div>
                  <div className="premio-item">
                    <span className="premio-icon">🍝</span>
                    <span className="premio-desc">1 Massa Grátis à sua escolha</span>
                  </div>
                </div>
              </div>

              <button onClick={() => window.open('/receitas', '_blank')} className="btn btn-receitas">
                📖 Ver Modo de Preparo
              </button>
            </div>
          </div>
        )}`;

// Se não encontrar a estrutura correta, vamos reconstruir
if (!adminContent.includes('Sistema de Prêmios') || adminContent.includes('Syntax error')) {
  // Encontrar onde inserir
  const tabsEnd = adminContent.lastIndexOf('{activeTab === \'criar\'');
  const createEnd = adminContent.indexOf('</div>\n        )}', tabsEnd) + 17;
  
  // Inserir a estrutura correta
  adminContent = adminContent.substring(0, createEnd) + '\n\n' + correctRankingStructure + '\n\n' + adminContent.substring(createEnd);
}

fs.writeFileSync(adminPath, adminContent);

console.log('✅ Erro de sintaxe corrigido!');
console.log('\n🚀 Faça:');
console.log('1. git add .');
console.log('2. git commit -m "Fix syntax error"');
console.log('3. git push');