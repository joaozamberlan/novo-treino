import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Aluno } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizarTelefone } from '../../common/utils/telefone';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { randomUUID } from 'crypto';
import {
  PaginationQueryDto,
  toSkipTake,
} from '../../common/dto/pagination-query.dto';

// Situação do login do aluno (telefone + PIN), mostrada na lista do treinador
export type AcessoAluno =
  'PIN_CRIADO' | 'AGUARDANDO_PRIMEIRO_ACESSO' | 'TELEFONE_INVALIDO';

// Os campos internos do login (hash do PIN, tentativas, bloqueio) nunca saem
// na API do treinador; no lugar deles vai só a situação do acesso.
const CAMPOS_INTERNOS = [
  'pinHash',
  'pinTentativas',
  'pinBloqueadoAte',
  'versaoToken',
] as const;
type CampoInterno = (typeof CAMPOS_INTERNOS)[number];

export function paraResposta<T extends Aluno>(
  aluno: T,
): Omit<T, CampoInterno> & { acesso: AcessoAluno } {
  const resto = Object.fromEntries(
    Object.entries(aluno).filter(
      ([campo]) => !CAMPOS_INTERNOS.includes(campo as CampoInterno),
    ),
  ) as Omit<T, CampoInterno>;

  let acesso: AcessoAluno = 'AGUARDANDO_PRIMEIRO_ACESSO';
  if (!aluno.telefoneLogin) acesso = 'TELEFONE_INVALIDO';
  else if (aluno.pinHash) acesso = 'PIN_CRIADO';
  return { ...resto, acesso };
}

@Injectable()
export class AlunosService {
  constructor(private prisma: PrismaService) {}

  // O telefone é o login do aluno: precisa ser um número utilizável e não
  // pode repetir entre os alunos do mesmo treinador.
  private async validarTelefoneLogin(
    telefone: string | null | undefined,
    idProfissional: number,
    idAlunoAtual?: number,
  ): Promise<string> {
    const telefoneLogin = normalizarTelefone(telefone);
    if (!telefoneLogin) {
      throw new BadRequestException(
        'Telefone inválido. Informe o DDD e o número do aluno.',
      );
    }
    const repetido = await this.prisma.aluno.findFirst({
      where: {
        idProfissional,
        telefoneLogin,
        ...(idAlunoAtual ? { idAluno: { not: idAlunoAtual } } : {}),
      },
      select: { nome: true },
    });
    if (repetido) {
      throw new ConflictException(
        `Esse telefone já está cadastrado para ${repetido.nome}.`,
      );
    }
    return telefoneLogin;
  }

  async create(createAlunoDto: CreateAlunoDto, idProfissional: number) {
    const telefoneLogin = await this.validarTelefoneLogin(
      createAlunoDto.telefone,
      idProfissional,
    );
    const aluno = await this.prisma.aluno.create({
      data: {
        ...createAlunoDto,
        telefoneLogin,
        idProfissional,
        tokenAcesso: randomUUID(),
      },
    });
    return paraResposta(aluno);
  }

  async findAll(idProfissional: number, pagination?: PaginationQueryDto) {
    const alunos = await this.prisma.aluno.findMany({
      where: { idProfissional },
      orderBy: { nome: 'asc' },
      // Periodização atual: a lista de alunos mostra qual é e quando termina
      include: {
        protocolos: {
          where: { ativo: true },
          take: 1,
          select: { idProtocolo: true, nome: true, dataFim: true },
        },
      },
      ...toSkipTake(pagination),
    });
    return alunos.map(paraResposta);
  }

  // Não recria o tokenAcesso quando ele é nulo: nulo significa link revogado,
  // e só o "gerar novo link" (regenerateToken) devolve o acesso.
  async findOne(idAluno: number, idProfissional: number) {
    const aluno = await this.prisma.aluno.findFirst({
      where: { idAluno, idProfissional },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }
    return paraResposta(aluno);
  }

  async update(
    idAluno: number,
    updateAlunoDto: UpdateAlunoDto,
    idProfissional: number,
  ) {
    // Check if student exists and belongs to the personal trainer
    await this.findOne(idAluno, idProfissional);

    // Telefone ausente no body mantém o atual; enviado (mesmo vazio) é validado
    const telefoneLogin =
      updateAlunoDto.telefone !== undefined
        ? await this.validarTelefoneLogin(
            updateAlunoDto.telefone,
            idProfissional,
            idAluno,
          )
        : undefined;

    const aluno = await this.prisma.aluno.update({
      where: { idAluno },
      data: { ...updateAlunoDto, telefoneLogin },
    });
    return paraResposta(aluno);
  }

  // Gera novos tokens e descarta os anteriores — tanto o tokenAcesso do aluno
  // quanto o tokenPublico de cada periodização, já que /publico/* aceita os
  // dois. Qualquer link antigo (e cópia vazada) para de funcionar na hora.
  async regenerateToken(idAluno: number, idProfissional: number) {
    const aluno = await this.prisma.aluno.findFirst({
      where: { idAluno, idProfissional },
      include: {
        protocolos: {
          where: { excluido: false },
          select: { idProtocolo: true },
        },
      },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }
    const [atualizado] = await this.prisma.$transaction([
      this.prisma.aluno.update({
        where: { idAluno },
        data: { tokenAcesso: randomUUID() },
        select: { idAluno: true, nome: true, tokenAcesso: true },
      }),
      ...aluno.protocolos.map((p) =>
        this.prisma.protocoloTreino.update({
          where: { idProtocolo: p.idProtocolo },
          data: { tokenPublico: randomUUID() },
        }),
      ),
    ]);
    return atualizado;
  }

  // Revoga todos os links do aluno (tokenAcesso e o tokenPublico de cada
  // periodização) sem gerar novos, e derruba as sessões abertas: o aluno só
  // volta a entrar quando o treinador gerar um link novo.
  async revokeToken(idAluno: number, idProfissional: number) {
    const aluno = await this.prisma.aluno.findFirst({
      where: { idAluno, idProfissional },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }
    const [atualizado] = await this.prisma.$transaction([
      this.prisma.aluno.update({
        where: { idAluno },
        data: { tokenAcesso: null, versaoToken: { increment: 1 } },
        select: { idAluno: true, nome: true, tokenAcesso: true },
      }),
      this.prisma.protocoloTreino.updateMany({
        where: { idAluno },
        data: { tokenPublico: null },
      }),
    ]);
    return atualizado;
  }

  // Apaga o PIN e derruba as sessões abertas. O aluno cria um PIN novo no
  // próximo acesso pelo link (o treinador reenvia).
  async redefinirPin(idAluno: number, idProfissional: number) {
    await this.findOne(idAluno, idProfissional);

    const aluno = await this.prisma.aluno.update({
      where: { idAluno },
      data: {
        pinHash: null,
        pinTentativas: 0,
        pinBloqueadoAte: null,
        versaoToken: { increment: 1 },
      },
    });
    return paraResposta(aluno);
  }

  async remove(idAluno: number, idProfissional: number) {
    // Check if student exists and belongs to the personal trainer
    await this.findOne(idAluno, idProfissional);

    return this.prisma.$transaction(async (tx) => {
      await tx.sessaoTreino.deleteMany({ where: { idAluno } });
      await tx.protocoloTreino.deleteMany({ where: { idAluno } });
      return paraResposta(await tx.aluno.delete({ where: { idAluno } }));
    });
  }
}
