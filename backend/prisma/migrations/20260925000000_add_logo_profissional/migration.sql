-- Logo do profissional guardada no banco (o disco do Railway é efêmero)
CREATE TABLE "LogoProfissional" (
    "idProfissional" INTEGER NOT NULL,
    "dados" BYTEA NOT NULL,
    "mime" TEXT NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogoProfissional_pkey" PRIMARY KEY ("idProfissional")
);

ALTER TABLE "LogoProfissional" ADD CONSTRAINT "LogoProfissional_idProfissional_fkey" FOREIGN KEY ("idProfissional") REFERENCES "Profissional"("idProfissional") ON DELETE CASCADE ON UPDATE CASCADE;

-- URLs de logo salvas sem protocolo (BACKEND_URL sem https://) viravam
-- caminho relativo no navegador e a imagem quebrava.
UPDATE "Profissional" SET "logoUrl" = 'https://' || "logoUrl"
WHERE "logoUrl" IS NOT NULL AND "logoUrl" NOT LIKE 'http%';
