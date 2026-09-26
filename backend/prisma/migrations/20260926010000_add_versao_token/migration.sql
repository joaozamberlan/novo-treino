-- Versão do JWT do profissional: sobe a cada troca/redefinição de senha e
-- invalida os tokens emitidos antes.
ALTER TABLE "Profissional" ADD COLUMN "versaoToken" INTEGER NOT NULL DEFAULT 0;
