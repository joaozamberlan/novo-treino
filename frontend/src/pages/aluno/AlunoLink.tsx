import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import alunoApi from '../../services/alunoApi';
import { AlunoAcessoShell, CampoPin, CampoTelefone } from '../../components/AlunoAcesso';
import { mensagemDeErro, telefoneValido } from '../../utils/alunoAcesso';
import { useAlunoAuth } from '../../contexts/AlunoAuthContext';

type Estado = 'CRIAR_PIN' | 'LOGIN' | 'ATUALIZAR_CADASTRO';

interface Acesso {
  estado: Estado;
  idAluno: number;
  primeiroNome: string;
  idProtocolo: number | null;
  profissional: { idProfissional: number; nome: string; logoUrl?: string | null };
}

const rotaDoProtocolo = (idProtocolo: number | null) =>
  idProtocolo ? `/aluno?protocolo=${idProtocolo}` : '/aluno';

// /v/:token — o link que o treinador envia. Não mostra o treino: no primeiro
// acesso o aluno confirma o telefone e cria o PIN; depois, entra com os dois.
export const AlunoLink: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { conta, login, primeiroAcesso, entrar } = useAlunoAuth();
  const navigate = useNavigate();

  const [acesso, setAcesso] = useState<Acesso | null>(null);
  const [erroLink, setErroLink] = useState('');
  const [telefone, setTelefone] = useState('');
  const [pin, setPin] = useState('');
  const [pinRepetido, setPinRepetido] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    document.title = 'Meu treino | TreinosApp';
    let cancelado = false;
    alunoApi.get(`/aluno/auth/acesso/${token}`)
      .then((res) => { if (!cancelado) setAcesso(res.data); })
      .catch((err) => {
        if (!cancelado) setErroLink(mensagemDeErro(err, 'Link inválido ou expirado. Fale com seu treinador.'));
      });
    return () => { cancelado = true; };
  }, [token]);

  // Erro do servidor limpa o PIN; quando o campo volta a ficar ativo, o foco vai para ele
  const focarPin = useRef(false);
  useEffect(() => {
    if (!enviando && focarPin.current) {
      focarPin.current = false;
      document.getElementById('pin')?.focus();
    }
  }, [enviando]);

  if (erroLink) {
    return (
      <AlunoAcessoShell titulo="Não foi possível abrir o treino">
        <p className="aluno-acesso-aviso aluno-acesso-aviso--erro" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span>{erroLink}</span>
        </p>
      </AlunoAcessoShell>
    );
  }

  if (!acesso) {
    return (
      <div className="aluno-acesso" style={{ color: 'var(--text-1)', gap: '0.75rem' }}>
        <RefreshCw className="animate-spin" size={22} aria-hidden="true" />
        <span>Abrindo seu treino…</span>
      </div>
    );
  }

  // Já logado neste navegador como o aluno do link: vai direto para o treino
  if (conta?.aluno.idAluno === acesso.idAluno) {
    return <Navigate to={rotaDoProtocolo(acesso.idProtocolo)} replace />;
  }

  if (acesso.estado === 'ATUALIZAR_CADASTRO') {
    return (
      <AlunoAcessoShell profissional={acesso.profissional} titulo={`Olá, ${acesso.primeiroNome}`}>
        <p className="aluno-acesso-aviso" role="status">
          Fale com seu treinador para atualizar seu cadastro. Falta um telefone válido para liberar seu acesso.
        </p>
      </AlunoAcessoShell>
    );
  }

  const criando = acesso.estado === 'CRIAR_PIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!telefoneValido(telefone)) {
      setErro('Informe seu telefone com DDD.');
      return;
    }
    if (pin.length !== 4) {
      setErro('O PIN tem 4 dígitos.');
      return;
    }
    if (criando && pin !== pinRepetido) {
      setErro('Os dois PINs não são iguais.');
      return;
    }

    setErro('');
    setEnviando(true);
    try {
      if (criando) {
        const idProtocolo = await primeiroAcesso(token, telefone, pin);
        navigate(rotaDoProtocolo(idProtocolo), { replace: true });
        return;
      }

      // O telefone pode estar com mais de um treinador; o link diz qual abrir
      const contas = await login(telefone, pin);
      const doLink = contas.find((c) => c.aluno.idAluno === acesso.idAluno);
      if (!doLink) {
        setPin('');
        setErro('Telefone ou PIN incorretos.');
        return;
      }
      entrar(doLink);
      navigate(rotaDoProtocolo(acesso.idProtocolo), { replace: true });
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setPin('');
      setPinRepetido('');
      // 409: o PIN foi criado em outro aparelho enquanto esta tela estava aberta
      if (criando && status === 409) setAcesso({ ...acesso, estado: 'LOGIN' });
      setErro(mensagemDeErro(err, criando ? 'Não foi possível criar o PIN.' : 'Telefone ou PIN incorretos.'));
      focarPin.current = true;
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AlunoAcessoShell
      profissional={acesso.profissional}
      titulo={`Olá, ${acesso.primeiroNome}`}
      subtitulo={
        criando
          ? 'Confirme seu telefone e crie um PIN de 4 dígitos. Você vai usar os dois para abrir seu treino.'
          : 'Entre com seu telefone e o PIN que você criou.'
      }
    >
      <form onSubmit={handleSubmit} noValidate className="aluno-acesso-form">
        {erro && <div className="auth-error" role="alert">{erro}</div>}

        <CampoTelefone
          id="telefone"
          label={criando ? 'Confirme seu telefone' : 'Telefone'}
          value={telefone}
          onChange={setTelefone}
          disabled={enviando}
          autoFocus
          hint={criando ? 'O mesmo número em que você recebeu este link.' : undefined}
        />
        <CampoPin id="pin" label={criando ? 'Crie um PIN de 4 dígitos' : 'PIN'} value={pin} onChange={setPin} disabled={enviando} novo={criando} />
        {criando && (
          <CampoPin id="pin-repetido" label="Repita o PIN" value={pinRepetido} onChange={setPinRepetido} disabled={enviando} novo />
        )}

        <button type="submit" className="btn-login-submit" disabled={enviando}>
          <span>{enviando ? 'Aguarde…' : criando ? 'Criar PIN e abrir treino' : 'Entrar'}</span>
          <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </form>

      {!criando && (
        <p className="aluno-acesso-nota">
          Esqueceu o PIN? Peça ao seu treinador para redefinir.
        </p>
      )}
    </AlunoAcessoShell>
  );
};
