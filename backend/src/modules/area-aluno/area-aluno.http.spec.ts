import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { PrismaService } from '../../prisma/prisma.service';
import { AreaAlunoModule } from './area-aluno.module';

const SEGREDO = 'segredo-de-teste-nao-usado-em-producao';

// Sobe as rotas /aluno/* de verdade (guard, strategy, pipes), só com o banco
// simulado, para provar quem entra e quem não entra.
describe('Rotas /aluno — quem consegue entrar', () => {
  let app: INestApplication;
  let prisma: {
    aluno: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      updateMany: jest.Mock;
    };
    protocoloTreino: { findFirst: jest.Mock; findMany: jest.Mock };
  };
  const jwt = new JwtService({ secret: SEGREDO });
  const originalEnv = process.env.JWT_SECRET;

  const tokenAluno = (ver = 0) =>
    jwt.sign({ sub: 1, tipo: 'aluno', ver }, { expiresIn: '90d' });

  beforeAll(async () => {
    process.env.JWT_SECRET = SEGREDO;
    prisma = {
      aluno: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      protocoloTreino: { findFirst: jest.fn(), findMany: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        AreaAlunoModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env.JWT_SECRET = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.aluno.findUnique.mockResolvedValue({
      idAluno: 1,
      idProfissional: 10,
      nome: 'Aluno A',
      versaoToken: 0,
      profissional: { idProfissional: 10, nome: 'Treinador' },
    });
  });

  it('sem token não entra', async () => {
    await request(app.getHttpServer()).get('/aluno/me').expect(401);
    await request(app.getHttpServer()).get('/aluno/protocolos').expect(401);
    await request(app.getHttpServer()).get('/aluno/sessao/100').expect(401);
  });

  it('token de treinador não entra na área do aluno', async () => {
    const tokenTreinador = jwt.sign({
      sub: 1,
      email: 'treinador@ex.com',
      tipo: 'profissional',
      ver: 0,
    });

    await request(app.getHttpServer())
      .get('/aluno/me')
      .set('Authorization', `Bearer ${tokenTreinador}`)
      .expect(401);
    expect(prisma.aluno.findUnique).not.toHaveBeenCalled();
  });

  it('token de aluno entra e recebe os próprios dados', async () => {
    const res = await request(app.getHttpServer())
      .get('/aluno/me')
      .set('Authorization', `Bearer ${tokenAluno()}`)
      .expect(200);

    expect(res.body.aluno).toMatchObject({ idAluno: 1, nome: 'Aluno A' });
    expect(res.body.profissional).toEqual({
      idProfissional: 10,
      nome: 'Treinador',
    });
    // Token recém-emitido (90 dias) ainda não precisa ser renovado
    expect(res.body.accessToken).toBeUndefined();
  });

  it('sessão cai depois que o treinador redefine o PIN ou revoga o acesso', async () => {
    const res = await request(app.getHttpServer())
      .get('/aluno/me')
      .set('Authorization', `Bearer ${tokenAluno(0)}`);
    expect(res.status).toBe(200);

    // versaoToken subiu no banco: o mesmo token deixa de valer
    prisma.aluno.findUnique.mockResolvedValue({
      idAluno: 1,
      idProfissional: 10,
      nome: 'Aluno A',
      versaoToken: 1,
    });

    const depois = await request(app.getHttpServer())
      .get('/aluno/me')
      .set('Authorization', `Bearer ${tokenAluno(0)}`)
      .expect(401);
    expect(depois.body.message).toBe(
      'Seu acesso foi atualizado. Entre de novo.',
    );
  });

  it('protocolos/atual não é confundido com protocolos/:idProtocolo', async () => {
    prisma.protocoloTreino.findFirst.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .get('/aluno/protocolos/atual')
      .set('Authorization', `Bearer ${tokenAluno()}`)
      .expect(200);

    expect(res.body).toEqual({ protocolo: null, isAtual: true });
  });

  it('o id do aluno vem sempre do token, nunca da URL', async () => {
    prisma.protocoloTreino.findMany.mockResolvedValue([]);

    await request(app.getHttpServer())
      .get('/aluno/protocolos?idAluno=2')
      .set('Authorization', `Bearer ${tokenAluno()}`)
      .expect(200);

    expect(prisma.protocoloTreino.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { idAluno: 1, excluido: false } }),
    );
  });

  it('login exige PIN de 4 dígitos', async () => {
    for (const pin of ['123', '12345', 'abcd', '']) {
      await request(app.getHttpServer())
        .post('/aluno/auth/login')
        .send({ telefone: '(54) 99999-0000', pin })
        .expect(400);
    }
    expect(prisma.aluno.findMany).not.toHaveBeenCalled();
  });

  it('login devolve um token que abre a área do aluno', async () => {
    prisma.aluno.findMany.mockResolvedValue([
      {
        idAluno: 1,
        nome: 'Aluno A',
        telefoneLogin: '5554999990000',
        pinHash: bcrypt.hashSync('4821', 4),
        versaoToken: 0,
        pinBloqueadoAte: null,
        profissional: { idProfissional: 10, nome: 'Treinador', logoUrl: null },
      },
    ]);
    prisma.aluno.updateMany.mockResolvedValue({ count: 0 });

    const login = await request(app.getHttpServer())
      .post('/aluno/auth/login')
      .send({ telefone: '(54) 99999-0000', pin: '4821' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/aluno/me')
      .set('Authorization', `Bearer ${login.body.contas[0].accessToken}`)
      .expect(200);
  });
});
