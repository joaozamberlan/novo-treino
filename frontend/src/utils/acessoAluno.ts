// Situação do login do aluno (telefone + PIN), como a API /alunos devolve
export type AcessoAluno = 'PIN_CRIADO' | 'AGUARDANDO_PRIMEIRO_ACESSO' | 'TELEFONE_INVALIDO';

export const ROTULO_ACESSO: Record<AcessoAluno, { texto: string; classe: string; dica: string }> = {
  PIN_CRIADO: {
    texto: 'PIN criado',
    classe: 'badge-success',
    dica: 'O aluno já criou o PIN e entra com telefone + PIN.',
  },
  AGUARDANDO_PRIMEIRO_ACESSO: {
    texto: 'Aguardando 1º acesso',
    classe: 'badge-neutral',
    dica: 'O aluno ainda não abriu o link para criar o PIN.',
  },
  TELEFONE_INVALIDO: {
    texto: 'Telefone inválido',
    classe: 'badge-danger',
    dica: 'O telefone não serve para login. Edite o aluno e informe DDD + número.',
  },
};
