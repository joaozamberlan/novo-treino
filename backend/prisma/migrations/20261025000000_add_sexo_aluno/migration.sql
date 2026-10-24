-- Sexo do aluno (opcional): escolhe o corpo do mapa do volume semanal
-- ('masculino' | 'feminino'). Vazio: o mapa usa a última escolha do aparelho.
ALTER TABLE "Aluno" ADD COLUMN "sexo" TEXT;
