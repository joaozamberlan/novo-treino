import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { PublicTreino } from './pages/PublicTreino';
import { ExerciseCardPrototype } from './pages/prototypes/ExerciseCardPrototype';
import { Alunos } from './pages/Alunos';
import { Home } from './pages/Home';
import { Periodizacoes } from './pages/Periodizacoes';
import { Treinos } from './pages/Treinos';
import { Catalog } from './pages/Catalog';
import { Admin } from './pages/Admin';
import { Configuracoes } from './pages/Configuracoes';
import { useMobileViewportFix } from './hooks/useMobileViewportFix';
import { LAST_PUBLIC_TOKEN_KEY } from './constants/storageKeys';
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
    // A PWA instalado a partir do link público de um aluno tem start_url "/",
    // que exige login do treinador — algo que o aluno não tem. Se este
    // navegador já visitou um link público antes, manda de volta pra lá em
    // vez da tela de login.
    const lastPublicToken = localStorage.getItem(LAST_PUBLIC_TOKEN_KEY);
    if (lastPublicToken) {
      return <Navigate to={`/v/${lastPublicToken}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  useMobileViewportFix();

  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="bottom-right" richColors closeButton />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/v/:token" element={<PublicTreino />} />
            <Route path="/prototypes/exercise-card" element={<ExerciseCardPrototype />} />

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
              <Route path="alunos/:idAluno/periodizacoes" element={<Periodizacoes />} />
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
    </MotionConfig>
  );
}

export default App;
