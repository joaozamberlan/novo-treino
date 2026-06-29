import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PublicTreino } from './pages/PublicTreino';
import { Alunos } from './pages/Alunos';
import { Home } from './pages/Home';
import { Treinos } from './pages/Treinos';
import { Catalog } from './pages/Catalog';
import { Admin } from './pages/Admin';
import { Configuracoes } from './pages/Configuracoes';
import './App.css';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signed, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-1)' }}>
        Verificando credenciais...
      </div>
    );
  }

  if (!signed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/v/:token" element={<PublicTreino />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Home />} />
            <Route path="alunos" element={<Alunos />} />
            <Route path="alunos/:idAluno/treinos" element={<Treinos />} />
            <Route path="exercicios" element={<Catalog />} />
            <Route path="admin" element={<Admin />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
