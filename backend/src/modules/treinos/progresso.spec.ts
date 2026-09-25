import { parseFaixa } from './progresso';

describe('parseFaixa', () => {
  it.each([
    ['5-8', [5, 8]],
    ['5 - 8', [5, 8]],
    ['8–12', [8, 12]],
    ['6 a 10', [6, 10]],
    ['12-8', [8, 12]],
    ['10', [10, 10]],
    ['8-12 (falha)', [8, 12]],
    ['falha', null],
    ['', null],
  ])('%s → %j', (entrada, esperado) => {
    expect(parseFaixa(entrada)).toEqual(esperado);
  });
});
