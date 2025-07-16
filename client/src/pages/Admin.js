import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';

// Configurar token padrão no axios
if (localStorage.getItem('token')) {
  axios.defaults.headers.common['Authorization'] = localStorage.getItem('token');
}

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
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/pessoas`, {
        headers: {
          'Authorization': token
        }
      });
      setPessoas(response.data);
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error);
      if (error.response && error.response.status === 401) {
        window.location.href = '/login';
      }
    }
  };

  const formatarTelefone = (telefone) => {
    const numero = telefone.replace(/\D/g, '');
    
    if (numero.length === 11) {
      return `(${numero.slice(0, 2)}) ${numero.slice(2, 7)}-${numero.slice(7)}`;
    } else if (numero.length === 10) {
      return `(${numero.slice(0, 2)}) ${numero.slice(2, 6)}-${numero.slice(6)}`;
    } else if (numero.length === 9) {
      return `${numero.slice(0, 5)}-${numero.slice(5)}`;
    }
    
    return telefone;
  };

  const limparTelefone = (telefone) => {
    return telefone.replace(/\D/g, '');
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
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/pessoas`, novaPessoa, {
        headers: {
          'Authorization': token
        }
      });
      alert(`Pessoa criada! Link: ${response.data.link}`);
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
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/pessoas/${id}`, dadosEdicao, {
        headers: {
          'Authorization': token
        }
      });
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
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/pessoas/${id}`, { [campo]: valor }, {
        headers: {
          'Authorization': token
        }
      });
      fetchPessoas();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const copiarLink = (pessoa) => {
    const link = `${window.location.origin}/indicacao/${pessoa.codigo}`;
    navigator.clipboard.writeText(link);
    setMensagemCopiado(pessoa.id);
    setTimeout(() => setMensagemCopiado(''), 2000);
  };

  const compartilharWhatsApp = (pessoa) => {
    const link = `${window.location.origin}/indicacao/${pessoa.codigo}`;
    const telefoneNumero = limparTelefone(pessoa.telefone);
    const telefoneCompleto = telefoneNumero.startsWith('55') ? telefoneNumero : '55' + telefoneNumero;
    
    const mensagem = "Olá " + pessoa.nome + "!\n\n" +
      "Aqui está seu link exclusivo para indicar amigos e ganhar prêmios! 🎁\n\n" +
      "👉 Seu link: " + link + "\n\n" +
      "✨ Como funciona:\n" +
      "• Compartilhe com amigos e familiares\n" +
      "• Eles ganham uma prova grátis\n" +
      "• Você acumula pontos para prêmios!\n\n" +
      "📍 Massas Vó Esmeralda\n" +
      "📞 WhatsApp: (11) 91510-9296\n" +
      "📸 Instagram: @massasvoesmeralda\n" +
      "📍 Rua Dentista Barreto, 863 - Vila Carrão\n\n" +
      "Quanto mais indicações, mais prêmios você ganha! 🏆";
    
    window.open(`https://wa.me/${telefoneCompleto}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
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

  const ranking = [...pessoas]
    .filter(p => p.total_indicacoes > 0)
    .sort((a, b) => b.total_indicacoes - a.total_indicacoes);

  
  

return (
    <div>
      <div className="header">
        <img src="/logo.png" alt="Massas Vó Esmeralda" className="logo" />
        <h1>Massas Vó Esmeralda - Administração</h1>
        
        <button onClick={handleLogout} className="logout-btn">Sair</button>
      </div>

      <div className="container">
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

        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'pessoas' ? 'active' : ''}`}
            onClick={() => setActiveTab('pessoas')}
          >
            📋 Todas as Pessoas
          </button>
          <button 
            className={`tab ${activeTab === 'ranking' ? 'active' : ''}`}
            onClick={() => setActiveTab('ranking')}
          >
            🏆 Ranking
          </button>
          <button 
            className={`tab ${activeTab === 'criar' ? 'active' : ''}`}
            onClick={() => setActiveTab('criar')}
          >
            ➕ Criar Indicador
          </button>
        </div>

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

        {activeTab === 'ranking' && (
          <div>
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
                        {index > 2 && `${index + 1}º`}
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
          </div>
        )}

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

export default Admin;