-- Recovery migration: Add missing exercises for Bíceps, Tríceps, and Costas
-- These exercises were part of the default catalog but disappeared from some accounts

-- First, identify professionals who have the muscle groups but may be missing exercises
-- For each professional with Bíceps, Tríceps, or Costas groups, we'll add any missing exercises

-- Add missing Bíceps exercises
INSERT INTO "Exercicio" ("idGrupoMuscular", "idProfissional", "nome", "ativo")
SELECT gm."idGrupoMuscular", gm."idProfissional", e.nome, true
FROM "GrupoMuscular" gm
CROSS JOIN (
  SELECT 'Rosca scott' AS nome UNION ALL
  SELECT 'Rosca scott unilateral com halter' UNION ALL
  SELECT 'Rosca bayesian' UNION ALL
  SELECT 'Rosca banco 45°' UNION ALL
  SELECT 'Rosca direta com barra' UNION ALL
  SELECT 'Rosca martelo com halteres' UNION ALL
  SELECT 'Rosca alternada' UNION ALL
  SELECT 'Rosca concentrada' UNION ALL
  SELECT 'Rosca martelo na polia'
) e(nome)
WHERE gm.nome = 'Bíceps' AND gm.ativo = true
AND NOT EXISTS (
  SELECT 1 FROM "Exercicio" ex
  WHERE ex."idGrupoMuscular" = gm."idGrupoMuscular"
  AND ex.nome = e.nome
)
ON CONFLICT DO NOTHING;

-- Add missing Tríceps exercises
INSERT INTO "Exercicio" ("idGrupoMuscular", "idProfissional", "nome", "ativo")
SELECT gm."idGrupoMuscular", gm."idProfissional", e.nome, true
FROM "GrupoMuscular" gm
CROSS JOIN (
  SELECT 'Tríceps francês na polia' AS nome UNION ALL
  SELECT 'Tríceps testa na polia' UNION ALL
  SELECT 'Tríceps corda' UNION ALL
  SELECT 'Tríceps carter' UNION ALL
  SELECT 'Tríceps unilateral na polia alta' UNION ALL
  SELECT 'Paralela'
) e(nome)
WHERE gm.nome = 'Tríceps' AND gm.ativo = true
AND NOT EXISTS (
  SELECT 1 FROM "Exercicio" ex
  WHERE ex."idGrupoMuscular" = gm."idGrupoMuscular"
  AND ex.nome = e.nome
)
ON CONFLICT DO NOTHING;

-- Add missing Costas exercises
INSERT INTO "Exercicio" ("idGrupoMuscular", "idProfissional", "nome", "ativo")
SELECT gm."idGrupoMuscular", gm."idProfissional", e.nome, true
FROM "GrupoMuscular" gm
CROSS JOIN (
  SELECT 'Barra fixa' AS nome UNION ALL
  SELECT 'Remada curvada' UNION ALL
  SELECT 'Pulldown' UNION ALL
  SELECT 'Remada articulada' UNION ALL
  SELECT 'Pull around' UNION ALL
  SELECT 'Puxador frontal com pegada triângulo' UNION ALL
  SELECT 'T-bar row' UNION ALL
  SELECT 'Remada baixa' UNION ALL
  SELECT 'Remada curvada com peito apoiado no banco' UNION ALL
  SELECT 'Remada serrote' UNION ALL
  SELECT 'Puxador frontal com pegada pronada' UNION ALL
  SELECT 'Puxador frontal com pegada supinada' UNION ALL
  SELECT 'High-row supinado' UNION ALL
  SELECT 'High-row neutro' UNION ALL
  SELECT 'Low-row' UNION ALL
  SELECT 'Puxada alta articulada' UNION ALL
  SELECT 'Pullover máquina'
) e(nome)
WHERE gm.nome = 'Costas' AND gm.ativo = true
AND NOT EXISTS (
  SELECT 1 FROM "Exercicio" ex
  WHERE ex."idGrupoMuscular" = gm."idGrupoMuscular"
  AND ex.nome = e.nome
)
ON CONFLICT DO NOTHING;
