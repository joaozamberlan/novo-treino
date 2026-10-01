// Sessão do aluno (telefone + PIN). Fica separada da sessão do treinador
// (`@TreinosApp:token`): as duas podem existir no mesmo aparelho.
export const ALUNO_TOKEN_KEY = '@TreinosApp:alunoToken';
export const ALUNO_CONTA_KEY = '@TreinosApp:aluno';

// Última forma de entrar usada neste aparelho ('aluno' | 'treinador'). O app
// instalado sempre abre na raiz do site; sem sessão, é isto que decide se a
// raiz mostra o login do aluno ou o do treinador.
export const PERFIL_KEY = '@TreinosApp:perfil';
export type Perfil = 'aluno' | 'treinador';
