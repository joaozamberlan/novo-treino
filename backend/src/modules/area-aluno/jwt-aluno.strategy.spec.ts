import { UnauthorizedException } from '@nestjs/common';
import { JwtAlunoStrategy } from './jwt-aluno.strategy';
import { PrismaService } from '../../prisma/prisma.service';

const ALUNO = {
  idAluno: 1,
  idProfissional: 10,
  nome: 'Aluno A',
  versaoToken: 2,
};

function strategyCom(aluno: typeof ALUNO | null) {
  const findUnique = jest.fn().mockResolvedValue(aluno);
  const prisma = { aluno: { findUnique } } as unknown as PrismaService;
  return { strategy: new JwtAlunoStrategy(prisma), findUnique };
}

describe('JwtAlunoStrategy — validação do token do aluno', () => {
  const originalEnv = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'segredo-de-teste-nao-usado-em-producao';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalEnv;
  });

  it('aceita token de aluno na versão atual', async () => {
    const { strategy } = strategyCom(ALUNO);

    const logado = await strategy.validate({
      sub: 1,
      tipo: 'aluno',
      ver: 2,
      exp: 123,
    });

    expect(logado).toEqual({ ...ALUNO, tokenExp: 123 });
  });

  // O id 1 existe nas duas tabelas: sem checar o `tipo`, o token de um
  // treinador abriria a área do aluno de mesmo id.
  it('rejeita token de treinador sem nem consultar o banco', async () => {
    const { strategy, findUnique } = strategyCom(ALUNO);

    await expect(
      strategy.validate({
        sub: 1,
        tipo: 'profissional' as unknown as 'aluno',
        ver: 2,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(strategy.validate({ sub: 1, ver: 2 })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejeita token emitido antes de redefinir o PIN ou revogar o acesso', async () => {
    const { strategy } = strategyCom(ALUNO);

    await expect(
      strategy.validate({ sub: 1, tipo: 'aluno', ver: 1 }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita token de aluno que não existe mais', async () => {
    const { strategy } = strategyCom(null);

    await expect(
      strategy.validate({ sub: 1, tipo: 'aluno', ver: 2 }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
