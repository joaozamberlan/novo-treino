-- Migration de "baseline": alinha o histórico de migrations com o que o
-- schema.prisma já declara há tempos. As colunas SessaoTreino.concluida /
-- SessaoTreino.finalizadoEm e a tabela inteira SessaoExercicioSerie são
-- usadas ativamente pelo código (backend/src/modules/publico) mas não têm
-- nenhuma migration correspondente em prisma/migrations — tudo indica que
-- foram aplicadas direto no banco (ex.: `prisma db push`) em algum momento,
-- fora do fluxo normal de `prisma migrate`.
--
-- Como não é possível confirmar com certeza o estado exato do banco de
-- produção sem conectar nele, cada comando abaixo é escrito para ser
-- IDEMPOTENTE: se o objeto já existir, o comando não faz nada; se não
-- existir, ele cria exatamente o que o schema.prisma espera. Em nenhum
-- cenário ela apaga dados ou falha por já existir.

-- AlterTable: SessaoTreino ganha concluida/finalizadoEm, se ainda não tiver.
ALTER TABLE "SessaoTreino" ADD COLUMN IF NOT EXISTS "concluida" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SessaoTreino" ADD COLUMN IF NOT EXISTS "finalizadoEm" TIMESTAMP(3);

-- O índice único antigo (idAluno, idTreino, data) não existe mais no
-- schema.prisma atual — múltiplas sessões por aluno/treino/dia são
-- permitidas hoje (o schema só declara @@index([idAluno, idTreino]), sem
-- @@unique). Remove o constraint antigo, se ainda estiver no banco.
DROP INDEX IF EXISTS "SessaoTreino_idAluno_idTreino_data_key";

-- Garante o índice não-único que o schema.prisma atual realmente declara.
CREATE INDEX IF NOT EXISTS "SessaoTreino_idAluno_idTreino_idx" ON "SessaoTreino"("idAluno", "idTreino");

-- CreateTable: SessaoExercicioSerie, se ainda não existir.
CREATE TABLE IF NOT EXISTS "SessaoExercicioSerie" (
    "idSerie" SERIAL NOT NULL,
    "idSessao" INTEGER NOT NULL,
    "idTreinoExercicio" INTEGER NOT NULL,
    "numeroSerie" INTEGER NOT NULL,
    "cargaKg" DOUBLE PRECISION,
    "repeticoes" INTEGER,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessaoExercicioSerie_pkey" PRIMARY KEY ("idSerie")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SessaoExercicioSerie_idSessao_idTreinoExercicio_numeroSerie_key"
  ON "SessaoExercicioSerie"("idSessao", "idTreinoExercicio", "numeroSerie");

-- AddForeignKey — Postgres não tem "ADD CONSTRAINT IF NOT EXISTS", então
-- cada constraint é envolvida num bloco que ignora o erro "já existe".
DO $$
BEGIN
  ALTER TABLE "SessaoExercicioSerie"
    ADD CONSTRAINT "SessaoExercicioSerie_idSessao_fkey"
    FOREIGN KEY ("idSessao") REFERENCES "SessaoTreino"("idSessao") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "SessaoExercicioSerie"
    ADD CONSTRAINT "SessaoExercicioSerie_idTreinoExercicio_fkey"
    FOREIGN KEY ("idTreinoExercicio") REFERENCES "TreinoExercicio"("idTreinoExercicio") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
