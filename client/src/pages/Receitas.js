import React from 'react';
import { useNavigate } from 'react-router-dom';

function Receitas() {
  const navigate = useNavigate();
  
  const receitas = [
    {
      id: 1,
      nome: "Canelone de Presunto e Queijo",
      tempo_forno: "20-25 minutos",
      tempo_microondas: "8-10 minutos",
      preparo: [
        "Forre 1 bandeja com nosso molho",
        "Em seguida posicione os Canelones",
        "Coloque o restante do molho por cima da massa de preferência com 1 colher para melhor distribuição do nosso molho"
      ],
      dica: "Por ser pré-cozido, o tempo de preparo é bem reduzido! Fique de olho para não ressecar."
    }
  ];

  return (
    <div>
      <div className="header">
        <img src="/logo.png" alt="Massas Vó Esmeralda" className="logo" />
        <h1>Receitas - Massas Vó Esmeralda</h1>
        <button onClick={() => navigate(-1)} className="btn-voltar">Voltar</button>
      </div>

      <div className="container">
        {receitas.map(receita => (
          <div key={receita.id} className="card receita-card">
            <h2>{receita.nome}</h2>
            
            <div className="tempo-preparo">
              <div className="tempo-item">
                <span className="tempo-icon">🔥</span>
                <strong>Forno:</strong> 200 graus por {receita.tempo_forno}
              </div>
              <div className="tempo-item">
                <span className="tempo-icon">📡</span>
                <strong>Microondas:</strong> {receita.tempo_microondas}
              </div>
            </div>

            <h3>Modo de Preparo:</h3>
            <ol className="preparo-lista">
              {receita.preparo.map((passo, index) => (
                <li key={index}>{passo}</li>
              ))}
            </ol>

            <div className="dica-box">
              <strong>💡 Dica:</strong> {receita.dica}
            </div>

            <p className="buon-appetito">BUON APPETITO! 🍝</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Receitas;