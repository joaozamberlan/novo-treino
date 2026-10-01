// Validação e mensagens de erro das telas de entrada do aluno

export const telefoneValido = (telefone: string) => {
  const digitos = telefone.replace(/\D/g, '').replace(/^0+/, '');
  return digitos.length >= 10 && digitos.length <= 15;
};

// Mensagem do servidor quando existe; senão, uma explicação do que falhou
export function mensagemDeErro(err: unknown, padrao: string): string {
  const resposta = (err as { response?: { status?: number; data?: { message?: unknown } } })?.response;
  if (!resposta) return 'Sem conexão. Verifique sua internet e tente de novo.';

  const mensagem = Array.isArray(resposta.data?.message) ? resposta.data?.message[0] : resposta.data?.message;
  // Limite de requisições por IP: a mensagem padrão do servidor vem em inglês
  if (resposta.status === 429 && (typeof mensagem !== 'string' || mensagem.startsWith('ThrottlerException'))) {
    return 'Muitas tentativas. Aguarde um minuto e tente de novo.';
  }
  return typeof mensagem === 'string' && mensagem ? mensagem : padrao;
}
