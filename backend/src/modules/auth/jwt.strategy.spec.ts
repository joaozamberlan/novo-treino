import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';

describe('JwtStrategy — validação do payload do token', () => {
  const originalEnv = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = 'segredo-de-teste-nao-usado-em-producao';
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalEnv;
  });

  it('falha ao construir se JWT_SECRET não estiver definido (regressão do fallback removido)', () => {
    const withoutSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    const prisma = {
      profissional: { findUnique: jest.fn() },
    } as unknown as PrismaService;
    expect(() => new JwtStrategy(prisma)).toThrow();

    process.env.JWT_SECRET = withoutSecret;
  });

  it('aceita usuário existente e ativo', async () => {
    const prisma = {
      profissional: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ idProfissional: 1, ativo: true }),
      },
    } as unknown as PrismaService;
    const strategy = new JwtStrategy(prisma);

    const user = await strategy.validate({ sub: 1, email: 'x@ex.com' });
    expect(user).toEqual({ idProfissional: 1, ativo: true });
  });

  it('rejeita quando o profissional do token não existe mais', async () => {
    const prisma = {
      profissional: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;
    const strategy = new JwtStrategy(prisma);

    await expect(
      strategy.validate({ sub: 999, email: 'x@ex.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita quando o profissional foi desativado após o token ser emitido', async () => {
    const prisma = {
      profissional: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ idProfissional: 1, ativo: false }),
      },
    } as unknown as PrismaService;
    const strategy = new JwtStrategy(prisma);

    await expect(
      strategy.validate({ sub: 1, email: 'x@ex.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
