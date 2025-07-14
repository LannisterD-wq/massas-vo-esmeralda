const fs = require('fs');
const path = require('path');

console.log('🔧 Atualizando sistema Massas Vó Esmeralda...\n');

// Arquivos para atualizar
const updates = {
  // Atualizar o Admin.js com formatação de telefone e botão de editar
  'client/src/pages/Admin.js': `import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Admin() {
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

        {/* Criar Nova Pessoa */}
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

        {/* Lista de Pessoas */}
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
                      {pessoa.total_indicacoes > 0 && (
                        <p>✨ Fez {pessoa.total_indicacoes} indicações</p>
                      )}
                    </>
                  )}
                </div>
                {editando !== pessoa.id && (
                  <button onClick={() => iniciarEdicao(pessoa)} className="btn-edit">✏️ Editar</button>
                )}
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
      </div>
    </div>
  );
}

export default Admin;`,

  // Atualizar o IndicacaoForm.js com formatação
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
    const mensagem = \`Oi! Acabei de me cadastrar para experimentar as Massas da Vó Esmeralda! 🍝\\n\\nEles dão uma prova grátis - você só paga se gostar!\\n\\nUse meu link para pedir a sua: \${novoLink}\`;
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
          </div>
        ) : (
          <div className="card">
            <div className="success-message">
              <h3>✅ Cadastro realizado com sucesso!</h3>
              <p>Em breve entraremos em contato pelo WhatsApp para agendar sua prova grátis.</p>
            </div>

            <div style={{ backgroundColor: '#FFF3E0', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ color: '#F57C00', marginBottom: '10px' }}>
                🎁 Ganhe massas grátis indicando amigos!
              </h3>
              <p>Compartilhe seu link personalizado e ganhe recompensas!</p>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default IndicacaoForm;`,

  // Atualizar o CSS para melhor responsividade
  'client/src/App.css': `:root {
  --primary-brown: #8B5A3C;
  --secondary-orange: #D2691E;
  --light-beige: #F5E6D3;
  --dark-brown: #654321;
  --white: #FFFFFF;
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

.pessoa-info h3 {
  color: var(--primary-brown);
  margin-bottom: 5px;
}

.pessoa-info p {
  margin-bottom: 3px;
  color: #666;
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
  
  .pessoa-header {
    flex-direction: column;
    gap: 10px;
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
}`,

  // Atualizar o server.js para adicionar rota PUT
  'server.js': `const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configuração do multer para upload de logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'logo' + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Database setup
const db = new sqlite3.Database('./database.db');

// Criar tabelas
db.serialize(() => {
  // Tabela unificada de pessoas (indicadores e indicados)
  db.run(\`
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
  \`);

  // Tabela de configurações
  db.run(\`
    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY,
      logo_path TEXT
    )
  \`);
});

// Função para gerar código único
function gerarCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Rotas API

// Criar nova pessoa (indicador inicial ou através de indicação)
app.post('/api/pessoas', (req, res) => {
  const { nome, telefone, endereco, indicador_codigo } = req.body;
  const codigo = gerarCodigo();
  
  // Se tem indicador_codigo, buscar o ID do indicador
  if (indicador_codigo) {
    db.get(
      'SELECT id FROM pessoas WHERE codigo = ?',
      [indicador_codigo],
      (err, indicador) => {
        if (err || !indicador) {
          res.status(400).json({ error: 'Indicador não encontrado' });
          return;
        }
        
        // Inserir pessoa com indicador
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
              link: \`\${process.env.BASE_URL || 'http://localhost:5000'}/indicacao/\${codigo}\`,
              message: 'Cadastro realizado com sucesso! Você também pode indicar amigos com seu link personalizado.'
            });
          }
        );
      }
    );
  } else {
    // Inserir pessoa sem indicador (admin criando)
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
          link: \`\${process.env.BASE_URL || 'http://localhost:5000'}/indicacao/\${codigo}\`
        });
      }
    );
  }
});

// Listar todas as pessoas com suas indicações
app.get('/api/pessoas', (req, res) => {
  db.all(\`
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
  \`, (err, rows) => {
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

// Atualizar dados completos da pessoa (PUT)
app.put('/api/pessoas/:id', (req, res) => {
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

// Atualizar status da pessoa (PATCH)
app.patch('/api/pessoas/:id', (req, res) => {
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
    \`UPDATE pessoas SET \${updates.join(', ')} WHERE id = ?\`,
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

// Upload de logo
app.post('/api/upload-logo', upload.single('logo'), (req, res) => {
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

// Servir o React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`Servidor rodando na porta \${PORT}\`);
});`
};

// Atualizar os arquivos
Object.entries(updates).forEach(([filename, content]) => {
  const filePath = path.join(process.cwd(), filename);
  fs.writeFileSync(filePath, content);
  console.log(`✅ Arquivo atualizado: ${filename}`);
});

console.log('\n✅ Sistema atualizado com sucesso!');
console.log('\n🚀 Melhorias implementadas:');
console.log('- Formatação automática de telefone (11) 91234-5678');
console.log('- Botão de editar para cada pessoa');
console.log('- WhatsApp sempre adiciona +55 do Brasil');
console.log('- Melhor responsividade para mobile');
console.log('- Campos de telefone otimizados');
console.log('\n⚠️  Pare os servidores (Ctrl+C) e reinicie:');
console.log('Terminal 1: npm run dev');
console.log('Terminal 2: cd client && npm start');
