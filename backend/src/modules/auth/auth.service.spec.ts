import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

const SENHA_VALIDA = 'senha-correta-123';

describe('AuthService — autenticação', () => {
  let service: AuthService;
  let prisma: {
    profissional: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    grupoMuscular: { create: jest.Mock };
    exercicio: { create: jest.Mock };
    tecnicaTreino: { create: jest.Mock };
    instrucaoTreino: { create: jest.Mock };
  };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
      profissional: { findUnique: jest.fn(), create: jest.fn() },
      grupoMuscular: {
        create: jest.fn().mockResolvedValue({ idGrupoMuscular: 1 }),
      },
      exercicio: { create: jest.fn() },
      tecnicaTreino: { create: jest.fn() },
      instrucaoTreino: { create: jest.fn() },
    };
    jwtService = { sign: jest.fn().mockReturnValue('fake.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('autentica com credenciais válidas e conta ativa', async () => {
      const senhaHash = await bcrypt.hash(SENHA_VALIDA, 10);
      prisma.profissional.findUnique.mockResolvedValue({
        idProfissional: 1,
        email: 'treinador@ex.com',
        senhaHash,
        ativo: true,
        nome: 'Treinador',
        cref: '123',
        profissao: 'PT',
        logoUrl: null,
        role: 'USER',
      });

      const result = await service.login({
        email: 'treinador@ex.com',
        senha: SENHA_VALIDA,
      });

      expect(result.accessToken).toBe('fake.jwt.token');
      expect(result.profissional.email).toBe('treinador@ex.com');
    });

    it('rejeita senha inválida', async () => {
      const senhaHash = await bcrypt.hash(SENHA_VALIDA, 10);
      prisma.profissional.findUnique.mockResolvedValue({
        idProfissional: 1,
        email: 'treinador@ex.com',
        senhaHash,
        ativo: true,
      });

      await expect(
        service.login({ email: 'treinador@ex.com', senha: 'senha-errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita usuário inexistente', async () => {
      prisma.profissional.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nao-existe@ex.com', senha: SENHA_VALIDA }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita conta pendente de aprovação mesmo com senha correta', async () => {
      const senhaHash = await bcrypt.hash(SENHA_VALIDA, 10);
      prisma.profissional.findUnique.mockResolvedValue({
        idProfissional: 1,
        email: 'pendente@ex.com',
        senhaHash,
        ativo: false,
      });

      await expect(
        service.login({ email: 'pendente@ex.com', senha: SENHA_VALIDA }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    // Regressão do achado de enumeração de usuário: usuário inexistente e
    // senha errada em conta existente devem gerar a MESMA mensagem — sem
    // isso, um atacante consegue distinguir "e-mail não existe" de
    // "e-mail existe, senha errada" pela resposta.
    it('usa a mesma mensagem de erro para usuário inexistente e senha errada', async () => {
      const senhaHash = await bcrypt.hash(SENHA_VALIDA, 10);

      prisma.profissional.findUnique.mockResolvedValueOnce(null);
      let inexistenteMsg = '';
      try {
        await service.login({
          email: 'nao-existe@ex.com',
          senha: SENHA_VALIDA,
        });
      } catch (e) {
        inexistenteMsg = e instanceof UnauthorizedException ? e.message : '';
      }

      prisma.profissional.findUnique.mockResolvedValueOnce({
        idProfissional: 1,
        email: 'existe@ex.com',
        senhaHash,
        ativo: true,
      });
      let senhaErradaMsg = '';
      try {
        await service.login({ email: 'existe@ex.com', senha: 'senha-errada' });
      } catch (e) {
        senhaErradaMsg = e instanceof UnauthorizedException ? e.message : '';
      }

      expect(inexistenteMsg).toBe(senhaErradaMsg);
      expect(inexistenteMsg).not.toBe('');
    });
  });

  describe('register', () => {
    it('rejeita e-mail já cadastrado', async () => {
      prisma.profissional.findUnique.mockResolvedValue({ idProfissional: 1 });

      await expect(
        service.register({
          email: 'ja-existe@ex.com',
          senha: 'senha12345',
          nome: 'X',
          cref: '000',
        }),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(prisma.profissional.create).not.toHaveBeenCalled();
    });

    it('cria conta nova e nunca retorna o hash da senha', async () => {
      prisma.profissional.findUnique.mockResolvedValue(null);
      prisma.profissional.create.mockResolvedValue({
        idProfissional: 1,
        email: 'novo@ex.com',
        senhaHash: 'hash-nao-deveria-sair-daqui',
        nome: 'Novo',
        cref: '000',
        profissao: 'Personal Trainer',
        ativo: false,
        role: 'USER',
      });

      const result = await service.register({
        email: 'novo@ex.com',
        senha: 'senha12345',
        nome: 'Novo',
        cref: '000',
      });

      expect(result).not.toHaveProperty('senhaHash');
    });
  });
});
