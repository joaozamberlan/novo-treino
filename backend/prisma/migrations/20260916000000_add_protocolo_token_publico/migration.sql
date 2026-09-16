-- Adiciona um link público próprio para cada periodização (ProtocoloTreino),
-- em vez de depender só do tokenAcesso do aluno. Aditiva e não destrutiva:
-- nova coluna opcional, sem alterar nem apagar nada existente.

-- AlterTable
ALTER TABLE "ProtocoloTreino" ADD COLUMN "tokenPublico" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProtocoloTreino_tokenPublico_key" ON "ProtocoloTreino"("tokenPublico");
