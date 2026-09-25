-- Rodapé de treino: padrão por profissional e exceção por ficha
ALTER TABLE "Profissional" ADD COLUMN "rodapeTreino" TEXT;
ALTER TABLE "Treino" ADD COLUMN "rodape" TEXT;
