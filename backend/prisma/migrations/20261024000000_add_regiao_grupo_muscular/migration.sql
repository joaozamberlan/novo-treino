-- Região do corpo que o grupo acende na miniatura da Biblioteca e no mapa
-- do volume semanal (ex.: 'ombros', 'nenhuma'). Vazia: o app segue o nome
-- do grupo, como antes desta coluna.
ALTER TABLE "GrupoMuscular" ADD COLUMN "regiao" TEXT;
