// Tipos do domínio de treino compartilhados entre a área do treinador e o link
// público do aluno — as duas APIs devolvem o mesmo formato de periodização.

export interface GrupoMuscular {
  idGrupoMuscular: number;
  nome: string;
}

export interface Exercicio {
  idExercicio: number;
  nome: string;
  descricao?: string;
  videoUrl?: string;
  idGrupoMuscular: number;
  grupoMuscular: GrupoMuscular;
}

export interface TecnicaTreino {
  idTecnica: number;
  nome: string;
  descricao?: string;
}

export interface PrescribedExercise {
  idTreinoExercicio: number;
  series: number;
  repeticoes: string;
  carga?: string;
  descansoSegundos?: number;
  descansoMaxSegundos?: number;
  observacao?: string;
  ordem: number;
  exercicio: Exercicio;
  tecnica?: TecnicaTreino;
}

export interface FichaTreino {
  idTreino: number;
  nome: string;
  observacao?: string;
  rodape?: string | null;
  ordem: number;
  exercicios: PrescribedExercise[];
}

// Periodização sem as fichas (listagens)
export interface ProtocoloResumo {
  idProtocolo: number;
  nome: string;
  objetivo?: string;
  dataInicio?: string | null;
  dataFim?: string | null;
  ativo: boolean;
  tokenPublico?: string | null;
}

export interface Protocolo extends ProtocoloResumo {
  treinos: FichaTreino[];
}
