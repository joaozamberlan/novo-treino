import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { AlunoAcessoShell, CampoPin, CampoTelefone } from '../../components/AlunoAcesso';
import { mensagemDeErro, telefoneValido } from '../../utils/alunoAcesso';
import { useAlunoAuth, type ContaComToken } from '../../contexts/AlunoAuthContext';
import { PERFIL_KEY } from '../../constants/storageKeys';

// Login do aluno por telefone + PIN. É por aqui que o aluno entra no app
// instalado, que abre na raiz do site e não tem o link do treinador.
export const AlunoEntrar: React.FC = () => {
  const { conta, login, entrar } = useAlunoAuth();
  const navigate = useNavigate();

  const [telefone, setTelefone] = useState('');
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [esqueci, setEsqueci] = useState(false);
  // Mesmo telefone e PIN com mais de um treinador: o aluno escolhe qual abrir
  const [contas, setContas] = useState<ContaComToken[] | null>(null);

  useEffect(() => {
    document.title = 'Entrar | TreinosApp';
  }, []);

  if (conta) return <Navigate to="/aluno" replace />;

  const abrir = (escolhida: ContaComToken) => {
    entrar(escolhida);
    navigate('/aluno', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefoneValido(telefone)) {
      setErro('Informe seu telefone com DDD.');
      return;
    }
    if (pin.length !== 4) {
      setErro('O PIN tem 4 dígitos.');
      return;
    }

    setErro('');
    setEnviando(true);
    try {
      const encontradas = await login(telefone, pin);
      if (encontradas.length === 1) abrir(encontradas[0]);
      else setContas(encontradas);
    } catch (err) {
      setPin('');
      setErro(mensagemDeErro(err, 'Telefone ou PIN incorretos.'));
    } finally {
      setEnviando(false);
    }
  };

  if (contas) {
    return (
      <AlunoAcessoShell titulo="Qual treino você quer abrir?" subtitulo="Seu telefone está cadastrado com mais de um treinador.">
        <div className="perfil-opcoes">
          {contas.map((c) => (
            <button key={c.aluno.idAluno} type="button" className="perfil-opcao" onClick={() => abrir(c)}>
              {c.profissional.logoUrl ? (
                <img src={c.profissional.logoUrl} alt="" className="perfil-opcao-icone" />
              ) : (
                <span className="perfil-opcao-icone">{c.profissional.nome.charAt(0).toUpperCase()}</span>
              )}
              <span className="perfil-opcao-texto">
                <strong>{c.profissional.nome}</strong>
                <span>{c.aluno.nome}</span>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
      </AlunoAcessoShell>
    );
  }

  return (
    <AlunoAcessoShell
      titulo="Entrar no meu treino"
      subtitulo="Use o telefone cadastrado pelo seu treinador e o PIN que você criou."
      rodape={
        <>
          É treinador?{' '}
          <Link to="/login" onClick={() => localStorage.setItem(PERFIL_KEY, 'treinador')}>
            Entrar na área do treinador
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="aluno-acesso-form">
        {erro && <div className="auth-error" role="alert">{erro}</div>}

        <CampoTelefone id="telefone" label="Telefone" value={telefone} onChange={setTelefone} disabled={enviando} autoFocus />
        <CampoPin
          id="pin"
          label="PIN"
          value={pin}
          onChange={setPin}
          disabled={enviando}
          acao={
            <button type="button" className="aluno-acesso-link" onClick={() => setEsqueci((v) => !v)} aria-expanded={esqueci}>
              Esqueci meu PIN
            </button>
          }
        />
        {esqueci && (
          <p className="aluno-acesso-aviso" role="status">
            Peça ao seu treinador para redefinir. Ele envia o link do treino de novo e você cria um PIN novo por ele.
          </p>
        )}

        <button type="submit" className="btn-login-submit" disabled={enviando}>
          <span>{enviando ? 'Entrando…' : 'Entrar'}</span>
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </form>

      <p className="aluno-acesso-nota">
        Primeiro acesso? Abra o link que seu treinador enviou.
      </p>
    </AlunoAcessoShell>
  );
};
