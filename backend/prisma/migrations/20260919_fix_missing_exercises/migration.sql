-- Fix migration: Ensure all exercises are present for Bíceps, Tríceps, and Costas
-- This handles cases where the previous migration may not have worked correctly

-- Create temp table with exercise data
CREATE TEMP TABLE temp_exercises (
  grupo_nome VARCHAR(50),
  exercicio_nome VARCHAR(255)
);

-- Insert Bíceps exercises
INSERT INTO temp_exercises (grupo_nome, exercicio_nome) VALUES
('Bíceps', 'Rosca scott'),
('Bíceps', 'Rosca scott unilateral com halter'),
('Bíceps', 'Rosca bayesian'),
('Bíceps', 'Rosca banco 45°'),
('Bíceps', 'Rosca direta com barra'),
('Bíceps', 'Rosca martelo com halteres'),
('Bíceps', 'Rosca alternada'),
('Bíceps', 'Rosca concentrada'),
('Bíceps', 'Rosca martelo na polia'),

-- Insert Tríceps exercises
('Tríceps', 'Tríceps francês na polia'),
('Tríceps', 'Tríceps testa na polia'),
('Tríceps', 'Tríceps corda'),
('Tríceps', 'Tríceps carter'),
('Tríceps', 'Tríceps unilateral na polia alta'),
('Tríceps', 'Paralela'),

-- Insert Costas exercises
('Costas', 'Barra fixa'),
('Costas', 'Remada curvada'),
('Costas', 'Pulldown'),
('Costas', 'Remada articulada'),
('Costas', 'Pull around'),
('Costas', 'Puxador frontal com pegada triângulo'),
('Costas', 'T-bar row'),
('Costas', 'Remada baixa'),
('Costas', 'Remada curvada com peito apoiado no banco'),
('Costas', 'Remada serrote'),
('Costas', 'Puxador frontal com pegada pronada'),
('Costas', 'Puxador frontal com pegada supinada'),
('Costas', 'High-row supinado'),
('Costas', 'High-row neutro'),
('Costas', 'Low-row'),
('Costas', 'Puxada alta articulada'),
('Costas', 'Pullover máquina');

-- Insert exercises for each professional that has these muscle groups
INSERT INTO "Exercicio" ("idGrupoMuscular", "idProfissional", "nome", "ativo")
SELECT
  gm."idGrupoMuscular",
  gm."idProfissional",
  te.exercicio_nome,
  true
FROM "GrupoMuscular" gm
JOIN temp_exercises te ON gm.nome = te.grupo_nome
WHERE gm.ativo = true
AND NOT EXISTS (
  SELECT 1 FROM "Exercicio" ex
  WHERE ex."idGrupoMuscular" = gm."idGrupoMuscular"
  AND ex.nome = te.exercicio_nome
  AND ex."idProfissional" = gm."idProfissional"
)
ON CONFLICT DO NOTHING;
