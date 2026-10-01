// O telefone do aluno é texto livre ("(54) 99999-0000", "+55 54 ...").
// Para o login guardamos só dígitos com DDI: número brasileiro sem DDI
// (10 ou 11 dígitos) ganha o 55. A mesma regra está na migration
// add_login_aluno e em frontend/src/utils/whatsapp.ts.
export function normalizarTelefone(
  telefone: string | null | undefined,
): string | null {
  const digitos = (telefone ?? '').replace(/\D/g, '').replace(/^0+/, '');
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if (digitos.length >= 12 && digitos.length <= 15) return digitos;
  return null;
}
