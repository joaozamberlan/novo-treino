import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AlunoAuthProvider, useAlunoAuth } from './contexts/AlunoAuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Entrada } from './pages/Entrada';
import { AlunoEntrar } from './pages/aluno/AlunoEntrar';
import { AlunoLink } from './pages/aluno/AlunoLink';
import { AreaAluno } from './pages/aluno/AreaAluno';
import { Alunos } from './pages/Alunos';
import { Home } from './pages/Home';
import { Periodizacoes } from './pages/Periodizacoes';
import { Treinos } from './pages/Treinos';
import { Catalog } from './pages/Catalog';
import { Admin } from './pages/Admin';
import { Configuracoes } from './pages/Configuracoes';
import { useMobileViewportFix } from './hooks/useMobileViewportFix';
import { PERFIL_KEY } from './constants/storageKeys';
import './App.css';

// Protótipos só existem em desenvolvimento; fora do `vite dev` a rota nem é registrada
const ExerciseCardPrototype = import.meta.env.DEV
  ? lazy(() => import('./pages/prototypes/ExerciseCardPrototype').then((m) => ({ default: m.ExerciseCardPrototype })))
  : null;

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signed, loading } = useAuth();
  const { conta } = useAlunoAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-1)' }}>
        Verificando credenciais...
      </div>
    );
  }

  if (!signed) {
    // O app instalado sempre abre na raiz do site, que é a área do treinador.
    // Sem sessão de treinador, a raiz decide para onde ir: aluno logado vai
    // para o treino; senão, o login da última forma de entrar usada neste
    // aparelho; e quem nunca entrou escolhe o perfil.
    if (conta) return <Navigate to="/aluno" replace />;
    const perfil = localStorage.getItem(PERFIL_KEY);
    if (perfil === 'aluno') return <Navigate to="/aluno/entrar" replace />;
    if (perfil === 'treinador') return <Navigate to="/login" replace />;
    return <Navigate to="/entrada" replace />;
  }

  return <>{children}</>;
};

const RequireAluno: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { conta } = useAlunoAuth();
  return conta ? <>{children}</> : <Navigate to="/aluno/entrar" replace />;
};

function App() {
  useMobileViewportFix();

  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <AlunoAuthProvider>
        <BrowserRouter>
          <Toaster position="bottom-right" richColors closeButton />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/entrada" element={<Entrada />} />

            {/* Aluno: o link do treinador (primeiro acesso), o login e a área logada */}
            <Route path="/v/:token" element={<AlunoLink />} />
            <Route path="/aluno/entrar" element={<AlunoEntrar />} />
            <Route path="/aluno" element={<RequireAluno><AreaAluno /></RequireAluno>} />
            {ExerciseCardPrototype && (
              <Route
                path="/prototypes/exercise-card"
                element={<Suspense fallback={null}><ExerciseCardPrototype /></Suspense>}
              />
            )}

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
        </AlunoAuthProvider>
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;
