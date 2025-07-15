import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API_URL from '../config';

function Debug() {
  const [info, setInfo] = useState({});
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setInfo({
      token: token ? token.substring(0, 20) + '...' : 'Sem token',
      apiUrl: API_URL,
      env: process.env.NODE_ENV,
      hasToken: !!token,
      axiosHeader: axios.defaults.headers.common['Authorization'] || 'Não configurado'
    });
  }, []);

  const testApi = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token enviado:', token);
      
      const response = await axios.get(`${API_URL}/api/pessoas`, {
        headers: {
          'Authorization': token
        }
      });
      
      setTestResult('✅ Sucesso! ' + response.data.length + ' pessoas encontradas');
    } catch (error) {
      console.error('Erro completo:', error);
      setTestResult('❌ Erro: ' + error.message + ' - ' + (error.response?.data?.error || ''));
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Debug - Autenticação</h1>
      <pre>{JSON.stringify(info, null, 2)}</pre>
      <button onClick={testApi}>Testar API</button>
      <p>{testResult}</p>
    </div>
  );
}

export default Debug;