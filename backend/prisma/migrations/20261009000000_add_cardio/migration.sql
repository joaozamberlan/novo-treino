-- Aeróbico por ficha (tipo + minutos prescritos) e minutos feitos pelo aluno na sessão
ALTER TABLE "Treino" ADD COLUMN "cardioTipo" TEXT;
ALTER TABLE "Treino" ADD COLUMN "cardioMinutos" INTEGER;
ALTER TABLE "SessaoTreino" ADD COLUMN "cardioMinutosFeitos" INTEGER;
