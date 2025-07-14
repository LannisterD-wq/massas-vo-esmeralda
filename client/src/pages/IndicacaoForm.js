import React, { useState, useEffect } from 'react';
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
      const response = await axios.get(`/api/pessoa/${codigo}`);
      setIndicador(response.data);
    } catch (error) {
      console.error('Erro ao buscar indicador:', error);
    }
  };

  // Função para formatar telefone
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
    // Mensagem simples sem formatação especial
    const mensagem = "🍝 Massas Vó Esmeralda - Prova Grátis!\n\n" +
      "Oi! Acabei de me cadastrar para experimentar as deliciosas massas artesanais da Vó Esmeralda! 😋\n\n" +
      "Eles oferecem:\n" +
      "✅ Prova grátis - você só paga se gostar!\n" +
      "🏠 Entrega na sua casa\n" +
      "👵 Sabor caseiro de verdade\n" +
      "🎁 Programa de indicações com prêmios\n\n" +
      "Use meu link para pedir sua prova grátis:\n" +
      "👉 " + novoLink + "\n\n" +
      "📍 Onde encontrar:\n" +
      "📞 WhatsApp: (11) 91510-9296\n" +
      "📸 Instagram: @massasvoesmeralda\n" +
      "📍 Rua Dentista Barreto, 863 - Vila Carrão\n\n" +
      "Aproveite! É só clicar no link e cadastrar. 🍝✨";
    
    window.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, '_blank');
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
        <img src="/logo.png" alt="Massas Vó Esmeralda" className="logo" />
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

export default IndicacaoForm;