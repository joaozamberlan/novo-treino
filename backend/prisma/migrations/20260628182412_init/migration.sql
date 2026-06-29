-- CreateTable
CREATE TABLE "Profissional" (
    "idProfissional" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "cref" TEXT NOT NULL,
    "profissao" TEXT NOT NULL DEFAULT 'Personal Trainer',
    "telefone" TEXT,
    "instagram" TEXT,
    "logoUrl" TEXT,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Profissional_pkey" PRIMARY KEY ("idProfissional")
);

-- CreateTable
CREATE TABLE "Aluno" (
    "idAluno" SERIAL NOT NULL,
    "idProfissional" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "dataCadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Aluno_pkey" PRIMARY KEY ("idAluno")
);

-- CreateTable
CREATE TABLE "ProtocoloTreino" (
    "idProtocolo" SERIAL NOT NULL,
    "idAluno" INTEGER NOT NULL,
    "idProfissional" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "objetivo" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProtocoloTreino_pkey" PRIMARY KEY ("idProtocolo")
);

-- CreateTable
CREATE TABLE "Treino" (
    "idTreino" SERIAL NOT NULL,
    "idProtocolo" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "observacao" TEXT,
    "ordem" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Treino_pkey" PRIMARY KEY ("idTreino")
);

-- CreateTable
CREATE TABLE "GrupoMuscular" (
    "idGrupoMuscular" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "GrupoMuscular_pkey" PRIMARY KEY ("idGrupoMuscular")
);

-- CreateTable
CREATE TABLE "Exercicio" (
    "idExercicio" SERIAL NOT NULL,
    "idGrupoMuscular" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "videoUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Exercicio_pkey" PRIMARY KEY ("idExercicio")
);

-- CreateTable
CREATE TABLE "TecnicaTreino" (
    "idTecnica" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TecnicaTreino_pkey" PRIMARY KEY ("idTecnica")
);

-- CreateTable
CREATE TABLE "TreinoExercicio" (
    "idTreinoExercicio" SERIAL NOT NULL,
    "idTreino" INTEGER NOT NULL,
    "idExercicio" INTEGER NOT NULL,
    "idTecnica" INTEGER,
    "series" INTEGER NOT NULL DEFAULT 3,
    "repeticoes" TEXT NOT NULL DEFAULT '10',
    "carga" TEXT,
    "descansoSegundos" INTEGER DEFAULT 60,
    "observacao" TEXT,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "TreinoExercicio_pkey" PRIMARY KEY ("idTreinoExercicio")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profissional_email_key" ON "Profissional"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GrupoMuscular_nome_key" ON "GrupoMuscular"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Exercicio_nome_key" ON "Exercicio"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "TecnicaTreino_nome_key" ON "TecnicaTreino"("nome");

-- AddForeignKey
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_idProfissional_fkey" FOREIGN KEY ("idProfissional") REFERENCES "Profissional"("idProfissional") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocoloTreino" ADD CONSTRAINT "ProtocoloTreino_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "Aluno"("idAluno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocoloTreino" ADD CONSTRAINT "ProtocoloTreino_idProfissional_fkey" FOREIGN KEY ("idProfissional") REFERENCES "Profissional"("idProfissional") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treino" ADD CONSTRAINT "Treino_idProtocolo_fkey" FOREIGN KEY ("idProtocolo") REFERENCES "ProtocoloTreino"("idProtocolo") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercicio" ADD CONSTRAINT "Exercicio_idGrupoMuscular_fkey" FOREIGN KEY ("idGrupoMuscular") REFERENCES "GrupoMuscular"("idGrupoMuscular") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreinoExercicio" ADD CONSTRAINT "TreinoExercicio_idTreino_fkey" FOREIGN KEY ("idTreino") REFERENCES "Treino"("idTreino") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreinoExercicio" ADD CONSTRAINT "TreinoExercicio_idExercicio_fkey" FOREIGN KEY ("idExercicio") REFERENCES "Exercicio"("idExercicio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreinoExercicio" ADD CONSTRAINT "TreinoExercicio_idTecnica_fkey" FOREIGN KEY ("idTecnica") REFERENCES "TecnicaTreino"("idTecnica") ON DELETE SET NULL ON UPDATE CASCADE;
