-- Link de redefinição de senha enviado por e-mail ao treinador. Guarda só o
-- hash do token; a linha é apagada quando o link é usado ou substituído.
CREATE TABLE "TokenRedefinicaoSenha" (
    "idToken" SERIAL NOT NULL,
    "idProfissional" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenRedefinicaoSenha_pkey" PRIMARY KEY ("idToken")
);

CREATE UNIQUE INDEX "TokenRedefinicaoSenha_tokenHash_key" ON "TokenRedefinicaoSenha"("tokenHash");

CREATE INDEX "TokenRedefinicaoSenha_idProfissional_idx" ON "TokenRedefinicaoSenha"("idProfissional");

ALTER TABLE "TokenRedefinicaoSenha" ADD CONSTRAINT "TokenRedefinicaoSenha_idProfissional_fkey" FOREIGN KEY ("idProfissional") REFERENCES "Profissional"("idProfissional") ON DELETE CASCADE ON UPDATE CASCADE;
