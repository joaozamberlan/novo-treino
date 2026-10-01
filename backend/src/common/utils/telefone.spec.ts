import { normalizarTelefone } from './telefone';

describe('normalizarTelefone', () => {
  it.each([
    ['(54) 99999-0000', '5554999990000'],
    ['054 99999-0000', '5554999990000'],
    ['+55 54 99999-0000', '5554999990000'],
    ['54 3333-0000', '555433330000'],
    ['5554999990000', '5554999990000'],
  ])('%s → %s', (entrada, esperado) => {
    expect(normalizarTelefone(entrada)).toBe(esperado);
  });

  it.each([
    [''],
    [null],
    [undefined],
    ['99999-0000'],
    ['abc'],
    ['1'.repeat(16)],
  ])('rejeita %s', (entrada) => {
    expect(normalizarTelefone(entrada)).toBeNull();
  });
});
