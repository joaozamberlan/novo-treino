import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ExerciciosService } from './exercicios.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GrupoMuscularDto } from './dto/grupo-muscular.dto';

const ID_PROFISSIONAL = 3;

describe('ExerciciosService — região do grupo muscular', () => {
  let service: ExerciciosService;
  let prisma: {
    grupoMuscular: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      grupoMuscular: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn(),
        create: jest.fn((args: { data: unknown }) => args.data),
        update: jest.fn((args: { data: unknown }) => args.data),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciciosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ExerciciosService);
  });

  it('cria o grupo com a região escolhida', async () => {
    await service.createGrupoMuscular(
      'Ombro posterior',
      ID_PROFISSIONAL,
      'ombros',
    );
    expect(prisma.grupoMuscular.create).toHaveBeenCalledWith({
      data: {
        nome: 'Ombro posterior',
        idProfissional: ID_PROFISSIONAL,
        regiao: 'ombros',
      },
    });
  });

  it('cria sem região (vazia: o app segue o nome)', async () => {
    await service.createGrupoMuscular('Peito', ID_PROFISSIONAL);
    expect(prisma.grupoMuscular.create).toHaveBeenCalledWith({
      data: { nome: 'Peito', idProfissional: ID_PROFISSIONAL, regiao: null },
    });
  });

  it('edita a região junto com o nome', async () => {
    prisma.grupoMuscular.findFirst.mockResolvedValue({ idGrupoMuscular: 9 });
    await service.updateGrupoMuscular(
      9,
      'Mobilidade',
      ID_PROFISSIONAL,
      'nenhuma',
    );
    expect(prisma.grupoMuscular.update).toHaveBeenCalledWith({
      where: { idGrupoMuscular: 9 },
      data: { nome: 'Mobilidade', regiao: 'nenhuma' },
    });
  });

  it('edição sem região no pedido não apaga a salva', async () => {
    prisma.grupoMuscular.findFirst.mockResolvedValue({ idGrupoMuscular: 9 });
    await service.updateGrupoMuscular(9, 'Peitoral superior', ID_PROFISSIONAL);
    expect(prisma.grupoMuscular.update).toHaveBeenCalledWith({
      where: { idGrupoMuscular: 9 },
      data: { nome: 'Peitoral superior' },
    });
  });
});

describe('GrupoMuscularDto', () => {
  const erros = async (corpo: object) =>
    (await validate(plainToInstance(GrupoMuscularDto, corpo))).map(
      (e) => e.property,
    );

  it('aceita uma região da lista', async () => {
    expect(await erros({ nome: 'Ombro lateral', regiao: 'ombros' })).toEqual(
      [],
    );
  });

  it('aceita "nenhuma" e a ausência de região', async () => {
    expect(await erros({ nome: 'Mobilidade', regiao: 'nenhuma' })).toEqual([]);
    expect(await erros({ nome: 'Peito' })).toEqual([]);
  });

  it('recusa região fora da lista', async () => {
    expect(await erros({ nome: 'Peito', regiao: 'chest' })).toEqual(['regiao']);
  });
});
