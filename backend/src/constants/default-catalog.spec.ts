import { DEFAULT_CATALOG } from './default-catalog';

describe('DEFAULT_CATALOG', () => {
  // O nome do exercício é único por profissional: um nome repetido entre
  // grupos derruba o cadastro no meio e o treinador fica sem o resto do
  // catálogo, das técnicas e das instruções.
  it('não repete nome de exercício entre grupos', () => {
    const nomes = Object.values(DEFAULT_CATALOG).flat();
    const repetidos = nomes.filter((nome, i) => nomes.indexOf(nome) !== i);
    expect(repetidos).toEqual([]);
  });
});
