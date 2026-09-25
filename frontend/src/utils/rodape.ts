// Rodapé de cada treino. Prioridade: texto da própria ficha; null/undefined
// herda o padrão do treinador; "" (string vazia) esconde o rodapé nessa ficha.
export function rodapeEfetivo(
  rodapeFicha: string | null | undefined,
  rodapeTreinador: string | null | undefined,
): string {
  const texto = rodapeFicha ?? rodapeTreinador ?? '';
  return texto.trim();
}

// Sugestão de texto para o treinador usar como ponto de partida.
export const RODAPE_SUGERIDO =
  'Ajuste a carga para ficar dentro da faixa de repetições proposta. Se conseguir fazer mais repetições do que o indicado, aumente a carga para se manter na faixa.\n\nAs séries devem ser difíceis, com esforço e técnica adequada. Em caso de dúvida na execução, grave um vídeo para o treinador ajustar.';
