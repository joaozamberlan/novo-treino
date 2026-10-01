-- Login do aluno por telefone + PIN.
ALTER TABLE "Aluno"
  ADD COLUMN "telefoneLogin" TEXT,
  ADD COLUMN "pinHash" TEXT,
  ADD COLUMN "versaoToken" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "pinTentativas" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "pinBloqueadoAte" TIMESTAMP(3);

-- Preenche telefoneLogin dos alunos existentes com a mesma regra de
-- normalizarTelefone (src/common/utils/telefone.ts): só dígitos, sem zeros à
-- esquerda; 10 ou 11 dígitos ganham o DDI 55; de 12 a 15 ficam como estão.
UPDATE "Aluno" a
SET "telefoneLogin" = CASE
  WHEN length(t.digitos) IN (10, 11) THEN '55' || t.digitos
  WHEN length(t.digitos) BETWEEN 12 AND 15 THEN t.digitos
  ELSE NULL
END
FROM (
  SELECT
    "idAluno",
    regexp_replace(regexp_replace(coalesce("telefone", ''), '\D', '', 'g'), '^0+', '') AS digitos
  FROM "Aluno"
) t
WHERE a."idAluno" = t."idAluno";

CREATE INDEX "Aluno_telefoneLogin_idx" ON "Aluno"("telefoneLogin");
