-- Técnicas e instruções padrão para quem ficou sem elas: o cadastro parava no
-- "Agachamento búlgaro" repetido do catálogo (ver 20261002000000_add_exercicios_gluteo)
-- e não chegava a gravar as técnicas nem as instruções.
-- Técnica e instrução só são apagadas de forma lógica (ativo = false), então quem
-- não tem nenhuma linha nunca as recebeu; quem apagou todas continua sem elas.
-- Só para quem já tem catálogo: quem não tem nenhum grupo é semeado por inteiro
-- em seedCatalogForProfessional, que falharia com técnicas já gravadas.

INSERT INTO "TecnicaTreino" ("idProfissional", "nome", "descricao")
SELECT p."idProfissional", t.nome, t.descricao
FROM "Profissional" p
CROSS JOIN (VALUES
  ('Drop-set', 'Realiza falha, reduz carga 20-30%, falha novamente sem descanso.'),
  ('Rest-pause', 'Descansar 10-20 segundos e continuar até a falha.'),
  ('Bi-set', 'Fazer dois exercícios conjugados'),
  ('Super-set', 'Dois exercícios para grupos musculares antagonistas, feitos em sequência, normalmente com pouco ou nenhum descanso entre eles.'),
  ('Cluster set', 'Divide a série em blocos menores com pausas mais longas entre eles, priorizando manter força e qualidade das repetições. Ex.: 2 + 2 + 2 + 2.'),
  ('Myo-reps', 'Série de ativação próxima da falha seguida de mini-séries curtas com pausas breves — alto estímulo com pouco volume e tempo.'),
  ('Back-off set', 'Depois de uma série pesada, reduz a carga e faz mais repetições. Ex.: 6 reps pesadas → reduz 15% → 10 reps.'),
  ('Muscle rounds', 'Divide uma série pesada em vários mini-blocos de repetições, com descansos de ~10-15s. Ex.: 4 + 4 + 4 + 4 + 4.')
) AS t(nome, descricao)
WHERE EXISTS (SELECT 1 FROM "GrupoMuscular" g WHERE g."idProfissional" = p."idProfissional")
AND NOT EXISTS (SELECT 1 FROM "TecnicaTreino" x WHERE x."idProfissional" = p."idProfissional")
ON CONFLICT DO NOTHING;

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
) AS i(texto)
WHERE EXISTS (SELECT 1 FROM "GrupoMuscular" g WHERE g."idProfissional" = p."idProfissional")
AND NOT EXISTS (SELECT 1 FROM "InstrucaoTreino" x WHERE x."idProfissional" = p."idProfissional")
ON CONFLICT DO NOTHING;
