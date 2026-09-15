-- Fase 1: índices para as colunas de posse (idProfissional/idAluno/idTreino)
-- usadas em praticamente toda checagem de ownership do backend. Nenhuma
-- delas tinha índice próprio até aqui (índices únicos compostos existentes,
-- como GrupoMuscular_nome_idProfissional_key, não servem para filtrar só
-- por idProfissional porque a coluna não é a primeira do índice composto).
-- Somente CREATE INDEX — não destrutiva, não apaga nem altera dados.

-- CreateIndex
CREATE INDEX "Aluno_idProfissional_idx" ON "Aluno"("idProfissional");

-- CreateIndex
CREATE INDEX "ProtocoloTreino_idAluno_idProfissional_idx" ON "ProtocoloTreino"("idAluno", "idProfissional");

-- CreateIndex
CREATE INDEX "Treino_idProtocolo_idx" ON "Treino"("idProtocolo");

-- CreateIndex
CREATE INDEX "GrupoMuscular_idProfissional_idx" ON "GrupoMuscular"("idProfissional");

-- CreateIndex
CREATE INDEX "Exercicio_idProfissional_idx" ON "Exercicio"("idProfissional");

-- CreateIndex
CREATE INDEX "TecnicaTreino_idProfissional_idx" ON "TecnicaTreino"("idProfissional");

-- CreateIndex
CREATE INDEX "TreinoExercicio_idTreino_idx" ON "TreinoExercicio"("idTreino");
