const fs = require('fs');
const path = require('path');

console.log('📱 Melhorando mensagens de WhatsApp...\n');

// Arquivos para atualizar
const updates = {
  // Atualizar Admin.js com mensagem melhorada
  'client/src/pages/Admin.js': `import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Admin() {
  const [activeTab, setActiveTab] = useState('pessoas');
  const [pessoas, setPessoas] = useState([]);
  const [novaPessoa, setNovaPessoa] = useState({ nome: '', telefone: '', endereco: '' });
  const [filtro, setFiltro] = useState('');
  const [mensagemCopiado, setMensagemCopiado] = useState('');
  const [editando, setEditando] = useState(null);
  const [dadosEdicao, setDadosEdicao] = useState({});

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

  // Função para formatar telefone
  const formatarTelefone = (telefone) => {
    // Remove tudo que não é número
    const numero = telefone.replace(/\\D/g, '');
    
    // Se tem 11 dígitos (com DDD)
    if (numero.length === 11) {
      return \`(\${numero.slice(0, 2)}) \${numero.slice(2, 7)}-\${numero.slice(7)}\`;
    }
    // Se tem 10 dígitos (DDD + fixo)
    else if (numero.length === 10) {
      return \`(\${numero.slice(0, 2)}) \${numero.slice(2, 6)}-\${numero.slice(6)}\`;
    }
    // Se tem 9 dígitos (sem DDD)
    else if (numero.length === 9) {
      return \`\${numero.slice(0, 5)}-\${numero.slice(5)}\`;
    }
    
    return telefone;
  };

  // Função para limpar telefone (só números)
  const limparTelefone = (telefone) => {
    return telefone.replace(/\\D/g, '');
  };

  const handleTelefoneChange = (e, isEdicao = false) => {
    const valor = e.target.value;
    const numeroLimpo = limparTelefone(valor);
    
    if (isEdicao) {
      setDadosEdicao({...dadosEdicao, telefone: numeroLimpo});
    } else {
      setNovaPessoa({...novaPessoa, telefone: numeroLimpo});
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
      alert('Erro ao criar pessoa. Verifique os dados.');
    }
  };

  const iniciarEdicao = (pessoa) => {
    setEditando(pessoa.id);
    setDadosEdicao({
      nome: pessoa.nome,
      telefone: pessoa.telefone,
      endereco: pessoa.endereco || ''
    });
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setDadosEdicao({});
  };

  const salvarEdicao = async (id) => {
    try {
      await axios.put(\`/api/pessoas/\${id}\`, dadosEdicao);
      fetchPessoas();
      setEditando(null);
      setDadosEdicao({});
    } catch (error) {
      console.error('Erro ao atualizar pessoa:', error);
      alert('Erro ao atualizar dados.');
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
    const telefoneNumero = limparTelefone(pessoa.telefone);
    // Adiciona o 55 do Brasil se não tiver
    const telefoneCompleto = telefoneNumero.startsWith('55') ? telefoneNumero : '55' + telefoneNumero;
    
    const mensagem = \`🍝 *Olá \${pessoa.nome}!*

Aqui está seu link exclusivo para indicar amigos e ganhar prêmios! 🎁

👉 *Seu link:* \${link}

✨ *Como funciona:*
• Compartilhe com amigos e familiares
• Eles ganham uma prova grátis
• Você acumula pontos para prêmios!

📍 *Massas Vó Esmeralda*
📞 WhatsApp: (11) 91510-9296
📸 Instagram: @massasvoesmeralda
📍 Rua Dentista Barreto, 863 - Vila Carrão

_Quanto mais indicações, mais prêmios você ganha!_ 🏆\`;
    
    window.open(\`https://wa.me/\${telefoneCompleto}?text=\${encodeURIComponent(mensagem)}\`, '_blank');
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

  // Ranking de indicadores
  const ranking = [...pessoas]
    .filter(p => p.total_indicacoes > 0)
    .sort((a, b) => b.total_indicacoes - a.total_indicacoes);

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

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={\`tab \${activeTab === 'pessoas' ? 'active' : ''}\`}
            onClick={() => setActiveTab('pessoas')}
          >
            📋 Todas as Pessoas
          </button>
          <button 
            className={\`tab \${activeTab === 'ranking' ? 'active' : ''}\`}
            onClick={() => setActiveTab('ranking')}
          >
            🏆 Ranking
          </button>
          <button 
            className={\`tab \${activeTab === 'criar' ? 'active' : ''}\`}
            onClick={() => setActiveTab('criar')}
          >
            ➕ Criar Indicador
          </button>
        </div>

        {/* Criar Nova Pessoa */}
        {activeTab === 'criar' && (
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
                  type="tel"
                  placeholder="(11) 91234-5678"
                  value={formatarTelefone(novaPessoa.telefone)}
                  onChange={handleTelefoneChange}
                  maxLength="15"
                  required
                />
                <small style={{color: '#666', fontSize: '12px'}}>Digite apenas números</small>
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
        )}

        {/* Ranking */}
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

        {/* Lista de Pessoas */}
        {activeTab === 'pessoas' && (
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
                    {editando === pessoa.id ? (
                      <div className="edicao-form">
                        <input
                          type="text"
                          value={dadosEdicao.nome}
                          onChange={(e) => setDadosEdicao({...dadosEdicao, nome: e.target.value})}
                          placeholder="Nome"
                          className="edit-input"
                        />
                        <input
                          type="tel"
                          value={formatarTelefone(dadosEdicao.telefone)}
                          onChange={(e) => handleTelefoneChange(e, true)}
                          placeholder="Telefone"
                          className="edit-input"
                          maxLength="15"
                        />
                        <textarea
                          value={dadosEdicao.endereco}
                          onChange={(e) => setDadosEdicao({...dadosEdicao, endereco: e.target.value})}
                          placeholder="Endereço"
                          className="edit-input"
                          rows="2"
                        />
                        <div className="edit-buttons">
                          <button onClick={() => salvarEdicao(pessoa.id)} className="btn-save">Salvar</button>
                          <button onClick={cancelarEdicao} className="btn-cancel">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3>{pessoa.nome}</h3>
                        <p>📱 {formatarTelefone(pessoa.telefone)}</p>
                        {pessoa.endereco && <p>📍 {pessoa.endereco}</p>}
                        <p>🔗 Código: {pessoa.codigo}</p>
                        {pessoa.indicador_nome && (
                          <p>👤 Indicado por: <span className="indicador-badge">{pessoa.indicador_nome}</span></p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="pessoa-stats">
                    {pessoa.total_indicacoes > 0 && (
                      <div className="indicacao-counter">
                        <span className="counter-number">{pessoa.total_indicacoes}</span>
                        <span className="counter-label">indicações</span>
                      </div>
                    )}
                    {editando !== pessoa.id && (
                      <button onClick={() => iniciarEdicao(pessoa)} className="btn-edit">✏️</button>
                    )}
                  </div>
                </div>

                {editando !== pessoa.id && (
                  <>
                    <div className="link-container">
                      <span className="link-text">{window.location.origin}/indicacao/{pessoa.codigo}</span>
                      <div className="link-buttons">
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
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;`,

  // Atualizar IndicacaoForm.js com mensagem melhorada
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

  // Função para formatar telefone
  const formatarTelefone = (telefone) => {
    const numero = telefone.replace(/\\D/g, '');
    
    if (numero.length === 11) {
      return \`(\${numero.slice(0, 2)}) \${numero.slice(2, 7)}-\${numero.slice(7)}\`;
    } else if (numero.length === 10) {
      return \`(\${numero.slice(0, 2)}) \${numero.slice(2, 6)}-\${numero.slice(6)}\`;
    } else if (numero.length === 9) {
      return \`\${numero.slice(0, 5)}-\${numero.slice(5)}\`;
    }
    
    return telefone;
  };

  const limparTelefone = (telefone) => {
    return telefone.replace(/\\D/g, '');
  };

  const handleTelefoneChange = (e) => {
    const valor = e.target.value;
    const numeroLimpo = limparTelefone(valor);
    setFormData({...formData, telefone: numeroLimpo});
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
    const mensagem = \`🍝 *Massas Vó Esmeralda - Prova Grátis!*

Oi! Acabei de me cadastrar para experimentar as deliciosas massas artesanais da Vó Esmeralda! 😋

*Eles oferecem:*
✅ Prova grátis - você só paga se gostar!
🏠 Entrega na sua casa
👵 Sabor caseiro de verdade
🎁 Programa de indicações com prêmios

*Use meu link para pedir sua prova grátis:*
👉 \${novoLink}

📍 *Onde encontrar:*
📞 WhatsApp: (11) 91510-9296
📸 Instagram: @massasvoesmeralda
📍 Rua Dentista Barreto, 863 - Vila Carrão

_Aproveite! É só clicar no link e cadastrar._ 🍝✨\`;
    
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
                  type="tel"
                  placeholder="(11) 91234-5678"
                  value={formatarTelefone(formData.telefone)}
                  onChange={handleTelefoneChange}
                  maxLength="15"
                  required
                />
                <small style={{color: '#666', fontSize: '12px'}}>Digite apenas números</small>
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

            {/* Informações da loja */}
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#FFF3E0', borderRadius: '8px' }}>
              <h3 style={{ color: '#D2691E', marginBottom: '10px' }}>📍 Onde nos encontrar:</h3>
              <p>📞 WhatsApp: (11) 91510-9296</p>
              <p>📸 Instagram: <a href="https://www.instagram.com/massasvoesmeralda" target="_blank" rel="noopener noreferrer" style={{ color: '#D2691E' }}>@massasvoesmeralda</a></p>
              <p>📍 Rua Dentista Barreto, 863 - Vila Carrão</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="success-message">
              <h3>✅ Cadastro realizado com sucesso!</h3>
              <p>Em breve entraremos em contato pelo WhatsApp para agendar sua prova grátis.</p>
            </div>

            <div style={{ backgroundColor: '#FFF3E0', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ color: '#F57C00', marginBottom: '10px' }}>
                🎁 Ganhe prêmios indicando amigos!
              </h3>
              <p>Compartilhe seu link personalizado:</p>
              <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
                <li>Cada amigo ganha prova grátis</li>
                <li>Você acumula pontos</li>
                <li>Troque por massas grátis!</li>
              </ul>
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

              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
                💡 Dica: Salve este link para compartilhar quando quiser!
              </p>
            </div>

            {/* Informações da loja */}
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#F5F5F5', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '10px' }}>📱 Siga a gente:</h4>
              <p>Instagram: <a href="https://www.instagram.com/massasvoesmeralda" target="_blank" rel="noopener noreferrer" style={{ color: '#D2691E' }}>@massasvoesmeralda</a></p>
              <p>WhatsApp: (11) 91510-9296</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IndicacaoForm;`
};

// Atualizar os arquivos
Object.entries(updates).forEach(([filename, content]) => {
  const filePath = path.join(process.cwd(), filename);
  fs.writeFileSync(filePath, content);
  console.log(`✅ Arquivo atualizado: ${filename}`);
});

console.log('\n✅ Mensagens de WhatsApp melhoradas com sucesso!');
console.log('\n📱 Melhorias implementadas:');
console.log('- Mensagens formatadas com emojis e negrito');
console.log('- Dados reais da loja (telefone, Instagram, endereço)');
console.log('- Link do Instagram clicável');
console.log('- Incentivo para salvar o link');
console.log('- Explicação do programa de indicações');
console.log('\n⚠️  Pare os servidores (Ctrl+C) e reinicie:');
console.log('Terminal 1: npm run dev');
console.log('Terminal 2: cd client && npm start');
