const fs = require('fs');
const path = require('path');

console.log('🏆 Adicionando sistema de Ranking...\n');

// Arquivo para atualizar
const updates = {
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
    const mensagem = \`Olá \${pessoa.nome}! Aqui está seu link para indicar amigos para experimentar as Massas da Vó Esmeralda: \${link}\`;
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

  // Atualizar CSS com estilos do ranking
  'client/src/App.css': `:root {
  --primary-brown: #8B5A3C;
  --secondary-orange: #D2691E;
  --light-beige: #F5E6D3;
  --dark-brown: #654321;
  --white: #FFFFFF;
  --gold: #FFD700;
  --silver: #C0C0C0;
  --bronze: #CD7F32;
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

/* Tabs */
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  background-color: var(--white);
  padding: 10px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-wrap: wrap;
}

.tab {
  padding: 10px 20px;
  background: none;
  border: 2px solid transparent;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  color: var(--dark-brown);
  transition: all 0.3s;
  font-weight: 500;
}

.tab:hover {
  background-color: var(--light-beige);
}

.tab.active {
  background-color: var(--secondary-orange);
  color: var(--white);
  border-color: var(--secondary-orange);
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

.form-group small {
  display: block;
  margin-top: 5px;
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

.btn-edit {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 5px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-edit:hover {
  background-color: #45a049;
}

/* Ranking Styles */
.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background-color: #FAFAFA;
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.ranking-item:hover {
  border-color: var(--secondary-orange);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.ranking-position {
  font-size: 24px;
  font-weight: bold;
  min-width: 40px;
  text-align: center;
}

.ranking-info {
  flex: 1;
}

.ranking-info h3 {
  color: var(--primary-brown);
  margin-bottom: 5px;
}

.ranking-info p {
  color: #666;
  font-size: 14px;
}

.ranking-stats {
  display: flex;
  align-items: center;
  gap: 20px;
}

.indicacoes-count {
  text-align: center;
  background-color: var(--light-beige);
  padding: 10px 20px;
  border-radius: 10px;
}

.count-number {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: var(--secondary-orange);
}

.count-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-top: -5px;
}

.ranking-actions {
  display: flex;
  gap: 5px;
}

/* Contador de indicações na lista de pessoas */
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

.pessoa-info {
  flex: 1;
}

.pessoa-info h3 {
  color: var(--primary-brown);
  margin-bottom: 5px;
}

.pessoa-info p {
  margin-bottom: 3px;
  color: #666;
}

.pessoa-stats {
  display: flex;
  align-items: center;
  gap: 10px;
}

.indicacao-counter {
  background-color: var(--secondary-orange);
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  text-align: center;
  min-width: 60px;
}

.counter-number {
  display: block;
  font-size: 20px;
  font-weight: bold;
}

.counter-label {
  display: block;
  font-size: 10px;
  margin-top: -3px;
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
  justify-content: space-between;
  gap: 10px;
  word-break: break-all;
}

.link-text {
  flex: 1;
  font-family: monospace;
  font-size: 14px;
  overflow-x: auto;
}

.link-buttons {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
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

/* Estilos para edição */
.edicao-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.edit-input {
  padding: 8px;
  border: 2px solid var(--light-beige);
  border-radius: 5px;
  font-size: 14px;
}

.edit-input:focus {
  outline: none;
  border-color: var(--secondary-orange);
}

.edit-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.btn-save {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-save:hover {
  background-color: #45a049;
}

.btn-cancel {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel:hover {
  background-color: #da190b;
}

/* Responsividade aprimorada */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  .card {
    padding: 20px;
  }
  
  .header h1 {
    font-size: 1.8rem;
  }
  
  .tabs {
    padding: 5px;
  }
  
  .tab {
    padding: 8px 15px;
    font-size: 14px;
  }
  
  .pessoa-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .pessoa-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .ranking-item {
    flex-wrap: wrap;
    padding: 15px;
  }
  
  .ranking-position {
    font-size: 20px;
  }
  
  .ranking-info {
    flex: 1;
    min-width: 200px;
  }
  
  .ranking-stats {
    width: 100%;
    justify-content: center;
    margin-top: 10px;
  }
  
  .ranking-actions {
    margin-left: auto;
  }
  
  .status-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .status-controls label {
    padding: 10px;
    background-color: #F5F5F5;
    border-radius: 5px;
  }
  
  .link-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .link-text {
    font-size: 12px;
    padding: 10px;
    background-color: white;
    border-radius: 5px;
    margin-bottom: 10px;
  }
  
  .link-buttons {
    display: flex;
    gap: 10px;
    width: 100%;
  }
  
  .link-buttons button {
    flex: 1;
  }
  
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .stat-card {
    padding: 15px;
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  .filter-bar input {
    font-size: 16px; /* Evita zoom no iOS */
  }
  
  .form-group input,
  .form-group textarea {
    font-size: 16px; /* Evita zoom no iOS */
  }
  
  .btn {
    width: 100%;
    padding: 15px;
  }
  
  .btn-whatsapp {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header h1 {
    font-size: 1.5rem;
  }
  
  .stats-container {
    grid-template-columns: 1fr;
  }
  
  .pessoa-info p {
    font-size: 14px;
  }
  
  .tabs {
    flex-direction: column;
  }
  
  .tab {
    width: 100%;
    text-align: center;
  }
  
  .ranking-item {
    gap: 10px;
  }
  
  .indicacoes-count {
    padding: 8px 15px;
  }
  
  .count-number {
    font-size: 24px;
  }
}`
};

// Atualizar os arquivos
Object.entries(updates).forEach(([filename, content]) => {
  const filePath = path.join(process.cwd(), filename);
  fs.writeFileSync(filePath, content);
  console.log(`✅ Arquivo atualizado: ${filename}`);
});

console.log('\n✅ Sistema de Ranking adicionado com sucesso!');
console.log('\n🏆 Novas funcionalidades:');
console.log('- Aba de Ranking mostrando top indicadores');
console.log('- Contador visual de indicações em cada pessoa');
console.log('- Medalhas para os 3 primeiros lugares');
console.log('- Navegação por abas mais organizada');
console.log('\n⚠️  Pare os servidores (Ctrl+C) e reinicie:');
console.log('Terminal 1: npm run dev');
console.log('Terminal 2: cd client && npm start');
