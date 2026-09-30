// O telefone do aluno é texto livre ("(54) 99999-0000", "+55 54 ...").
// O wa.me exige só dígitos com DDI; número brasileiro sem DDI ganha o 55.
export function telefoneWhatsApp(telefone: string | null | undefined): string | null {
  const digitos = (telefone || '').replace(/\D/g, '').replace(/^0+/, '');
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if (digitos.length >= 12) return digitos;
  return null;
}

// Sem telefone válido, o WhatsApp abre com a mensagem e o treinador escolhe o contato.
export function linkWhatsApp(telefone: string | null | undefined, mensagem: string): string {
  const numero = telefoneWhatsApp(telefone) ?? '';
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
