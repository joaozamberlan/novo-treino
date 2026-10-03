-- Exercícios de glúteo do catálogo padrão para os profissionais já existentes.
-- Entram só no grupo "Glúteos" ativo de cada um: quem apagou o grupo não o
-- recebe de volta, e quem não tem catálogo continua sem (seedCatalogForProfessional
-- só semeia quem não tem nenhum grupo). Um nome que o profissional já usa, em
-- qualquer grupo e mesmo inativo, fica como está.
-- Cadeira abdutora e Glúteo na polia baixa vão junto: o cadastro parava antes
-- deles por causa do Agachamento búlgaro repetido no catálogo.
INSERT INTO "Exercicio" ("idGrupoMuscular", "idProfissional", "nome")
SELECT g."idGrupoMuscular", g."idProfissional", e.nome
FROM "GrupoMuscular" g
CROSS JOIN (VALUES
  ('Elevação pélvica'),
  ('Elevação pélvica na máquina'),
  ('Elevação pélvica no smith'),
  ('Elevação pélvica unilateral'),
  ('Ponte de glúteo'),
  ('Ponte de glúteo unilateral'),
  ('Glúteo na polia baixa'),
  ('Coice na máquina'),
  ('Coice com caneleira (4 apoios)'),
  ('Pull-through na polia'),
  ('Extensão de quadril no banco 45°'),
  ('Hiperextensão reversa'),
  ('Stiff unilateral'),
  ('Subida no banco (step-up)'),
  ('Cadeira abdutora'),
  ('Cadeira abdutora com tronco inclinado'),
  ('Abdução de quadril deitado de lado'),
  ('Concha com miniband'),
  ('Caminhada lateral com miniband')
) AS e(nome)
WHERE g."nome" = 'Glúteos' AND g."ativo" = true
AND NOT EXISTS (
  SELECT 1 FROM "Exercicio" ex
  WHERE ex."idProfissional" = g."idProfissional"
  AND ex."nome" = e.nome
)
ON CONFLICT DO NOTHING;
