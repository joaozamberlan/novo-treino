-- CreateTable
CREATE TABLE "InstrucaoTreino" (
    "idInstrucao" SERIAL NOT NULL,
    "idProfissional" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InstrucaoTreino_pkey" PRIMARY KEY ("idInstrucao")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstrucaoTreino_texto_idProfissional_key" ON "InstrucaoTreino"("texto", "idProfissional");
CREATE INDEX "InstrucaoTreino_idProfissional_idx" ON "InstrucaoTreino"("idProfissional");

-- AddForeignKey
ALTER TABLE "InstrucaoTreino" ADD CONSTRAINT "InstrucaoTreino_idProfissional_fkey" FOREIGN KEY ("idProfissional") REFERENCES "Profissional"("idProfissional") ON DELETE CASCADE ON UPDATE CASCADE;

-- Instruções padrão para os profissionais já existentes
INSERT INTO "InstrucaoTreino" ("idProfissional", "texto")
SELECT p."idProfissional", i.texto
FROM "Profissional" p
CROSS JOIN (VALUES
  ('Buscar a falha'),
  ('Manter boa carga com boa execução'),
  ('Se não tiver 2 polias livres, fazer unilateral'),
  ('Controlar a descida (excêntrica)'),
  ('Segurar 1 segundo na contração máxima'),
  ('Amplitude completa do movimento')
) AS i(texto);
