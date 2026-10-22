# Volume semanal: mapa do corpo + placar de séries

Data: 2026-10-21

## Problema

O gráfico de volume semanal (barras horizontais) é correto mas genérico. O
treinador quer algo marcante na tela, que dê vontade de printar. Sem função
nova de exportar imagem.

## Decisão

Juntar duas peças, sem caixa, com fio em cima:

1. **Mapa do corpo** (frente e costas) com `js-rich-body-highlighter` 0.1.1
   (MIT): ilustração anatômica detalhada, o músculo treinado "aceso" em
   vermelho por `mix-blend-mode` (4 tons, relativo ao grupo com mais séries
   da visão). Masculino/Feminino num toggle no próprio gráfico, lembrado no
   navegador. Ilustração clara ou escura conforme o tema do app.
2. **Placar de séries**: total grande em número de placar; uma linha por grupo
   com um bloco por série (os vazios completam até o maior grupo) e o número.

Passar o mouse ou focar uma linha destaca o músculo no corpo; tocar no músculo
destaca a linha. "Esta ficha | Semana" continua; ao trocar, os blocos acendem
em cascata curta (reduzir movimento: sem cascata).

Descartadas: `react-muscle-highlighter` e as libs de polígonos chapados
(achadas feias); `@emmorts/body-muscles` (geométrica, mais abstrata).

## Mapa grupo → região

Peito→chest; Costas→lats, upper_back, lower_back; Ombro→shoulders;
Bíceps→biceps; Tríceps→triceps; Antebraço→forearms; Abdômen→abs, obliques;
Glúteos→glutes; Quadríceps→quads; Isquiotibiais→hamstrings;
Panturrilha→calves. **Adutores não têm região na lib**: aparecem só no placar.
Grupo desconhecido também fica só no placar. Nomes comparados sem acento.

## Técnica

- `MapaCorpo` carregado com `React.lazy` (a lib e as imagens ficam fora do
  pacote principal; só a vista visível baixa, ~100 KB WebP, servida do
  próprio site, compatível com a CSP).
- Cor lida do `--accent` do tema; tema observado pela classe `light-theme`.
- Corpo decorativo para leitor de tela (`aria-hidden`); a informação está no
  placar, em texto.

## Fora do escopo

Exportar imagem, sexo no cadastro do aluno, cor por ficha.
