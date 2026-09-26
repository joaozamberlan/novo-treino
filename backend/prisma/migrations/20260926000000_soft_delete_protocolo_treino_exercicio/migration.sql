-- Exclusão lógica de periodizações e de exercícios da ficha: a exclusão física
-- apagava em cascata as sessões e as séries registradas pelo aluno.
ALTER TABLE "ProtocoloTreino" ADD COLUMN "excluido" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TreinoExercicio" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;
