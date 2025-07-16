import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Admin from './pages/Admin';
import IndicacaoForm from './pages/IndicacaoForm';
import Login from './pages/Login';
import Receitas from './pages/Receitas';
import Debug from './pages/Debug';
import './App.css';
import axios from 'axios';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = token;
    }
    setLoading(false);
  }, []);

  const handleLogin = (token) => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Router>
      <div className="App">
        
      
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/admin" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/admin" element={
            isAuthenticated ? <Admin onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
          <Route path="/" element={<Navigate to="/admin" />} />
          <Route path="/indicacao/:codigo" element={<IndicacaoForm />} />
          <Route path="/debug" element={<Debug />} />
          <Route path="/receitas" element={<Receitas />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;