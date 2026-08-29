-- CreateTable
CREATE TABLE "SessaoTreino" (
    "idSessao" SERIAL NOT NULL,
    "idAluno" INTEGER NOT NULL,
    "idTreino" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessaoTreino_pkey" PRIMARY KEY ("idSessao")
);

-- CreateTable
CREATE TABLE "ExercicioConcluido" (
    "idConcluido" SERIAL NOT NULL,
    "idSessao" INTEGER NOT NULL,
    "idTreinoExercicio" INTEGER NOT NULL,

    CONSTRAINT "ExercicioConcluido_pkey" PRIMARY KEY ("idConcluido")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessaoTreino_idAluno_idTreino_data_key" ON "SessaoTreino"("idAluno", "idTreino", "data");

-- CreateIndex
CREATE UNIQUE INDEX "ExercicioConcluido_idSessao_idTreinoExercicio_key" ON "ExercicioConcluido"("idSessao", "idTreinoExercicio");

-- AddForeignKey
ALTER TABLE "SessaoTreino" ADD CONSTRAINT "SessaoTreino_idAluno_fkey" FOREIGN KEY ("idAluno") REFERENCES "Aluno"("idAluno") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoTreino" ADD CONSTRAINT "SessaoTreino_idTreino_fkey" FOREIGN KEY ("idTreino") REFERENCES "Treino"("idTreino") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExercicioConcluido" ADD CONSTRAINT "ExercicioConcluido_idSessao_fkey" FOREIGN KEY ("idSessao") REFERENCES "SessaoTreino"("idSessao") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExercicioConcluido" ADD CONSTRAINT "ExercicioConcluido_idTreinoExercicio_fkey" FOREIGN KEY ("idTreinoExercicio") REFERENCES "TreinoExercicio"("idTreinoExercicio") ON DELETE CASCADE ON UPDATE CASCADE;
