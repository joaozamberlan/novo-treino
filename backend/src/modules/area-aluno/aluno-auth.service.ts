import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizarTelefone } from '../../common/utils/telefone';
import { LoginAlunoDto, PrimeiroAcessoDto } from './dto/aluno-auth.dto';
import type { AlunoLogado, JwtPayloadAluno } from './jwt-aluno.strategy';

export const MAX_TENTATIVAS_PIN = 5;
export const BLOQUEIO_PIN_MS = 15 * 60_000;

// Sessão longa: o aluno não deve precisar digitar o PIN a cada treino.
export const SESSAO_ALUNO_EXPIRA_EM = '90d';
// GET /aluno/me devolve um token novo quando faltam menos de 60 dias, então
// quem treina com frequência nunca chega a ver a tela de login de novo.
const RENOVAR_SE_FALTAR_MENOS_DE_SEG = 60 * 24 * 60 * 60;

export const MSG_CREDENCIAIS = 'Telefone ou PIN incorretos.';
export const MSG_BLOQUEADO =
  'Muitas tentativas. Tente de novo em 15 minutos ou peça ao seu treinador para redefinir o PIN.';
export const MSG_TELEFONE_NAO_CONFERE =
  'Esse telefone não confere com o cadastro. Fale com seu treinador.';
export const MSG_ATUALIZAR_CADASTRO =
  'Fale com seu treinador para atualizar seu cadastro.';
export const MSG_PIN_JA_CRIADO =
  'Você já criou seu PIN. Entre com telefone e PIN.';

// Hash "dummy" comparado quando nenhum aluno tem o telefone informado, para
// que a resposta leve o mesmo tempo com o telefone cadastrado ou não.
const DUMMY_PIN_HASH = bcrypt.hashSync('pin-nao-existe-para-timing-safety', 10);

const PROFISSIONAL_SELECT = {
  idProfissional: true,
  nome: true,
  logoUrl: true,
} as const;

interface AlunoComProfissional {
  idAluno: number;
  nome: string;
  telefoneLogin: string | null;
  pinHash: string | null;
  versaoToken: number;
  pinBloqueadoAte: Date | null;
  profissional: {
    idProfissional: number;
    nome: string;
    logoUrl: string | null;
  };
}

// O que o link do treinador pede ao aluno antes de mostrar o treino
export type EstadoAcesso = 'CRIAR_PIN' | 'LOGIN' | 'ATUALIZAR_CADASTRO';

@Injectable()
export class AlunoAuthService {
  // Tentativas em telefones que não são de nenhum aluno com PIN. Ficam em
  // memória só para o bloqueio se comportar igual ao de um telefone
  // cadastrado — senão "Muitas tentativas" revelaria quais números existem.
  private tentativasDesconhecidos = new Map<
    string,
    { tentativas: number; bloqueadoAte: number }
  >();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // Resolve o aluno pelo tokenPublico de uma periodização ou pelo tokenAcesso
  // antigo (links enviados antes de existir um token por periodização).
  private async getAlunoPorLink(token: string): Promise<{
    aluno: AlunoComProfissional;
    idProtocolo: number | null;
  }> {
    const include = { profissional: { select: PROFISSIONAL_SELECT } };
    const protocolo = await this.prisma.protocoloTreino.findUnique({
      where: { tokenPublico: token },
      select: { idProtocolo: true, aluno: { include } },
    });
    if (protocolo) {
      return { aluno: protocolo.aluno, idProtocolo: protocolo.idProtocolo };
    }

    const aluno = await this.prisma.aluno.findUnique({
      where: { tokenAcesso: token },
      include,
    });
    if (!aluno) {
      throw new NotFoundException('Ficha de treino não encontrada.');
    }
    return { aluno, idProtocolo: null };
  }

  // O link não mostra mais o treino: só diz qual tela abrir (criar PIN ou
  // entrar) e o mínimo para montá-la.
  async getAcesso(token: string) {
    const { aluno, idProtocolo } = await this.getAlunoPorLink(token);
    let estado: EstadoAcesso = 'LOGIN';
    if (!aluno.telefoneLogin) estado = 'ATUALIZAR_CADASTRO';
    else if (!aluno.pinHash) estado = 'CRIAR_PIN';

    return {
      estado,
      idAluno: aluno.idAluno,
      primeiroNome: aluno.nome.trim().split(/\s+/)[0],
      idProtocolo,
      profissional: aluno.profissional,
    };
  }

  // Primeiro acesso: o link prova a posse, o telefone confirma que é o aluno
  // certo, e ele escolhe o PIN que usará dali em diante.
  async primeiroAcesso(dto: PrimeiroAcessoDto) {
    const { aluno, idProtocolo } = await this.getAlunoPorLink(dto.token);

    if (!aluno.telefoneLogin) {
      throw new ConflictException(MSG_ATUALIZAR_CADASTRO);
    }
    if (aluno.pinHash) {
      throw new ConflictException(MSG_PIN_JA_CRIADO);
    }
    if (this.estaBloqueado(aluno)) {
      throw this.erroBloqueado();
    }
    if (normalizarTelefone(dto.telefone) !== aluno.telefoneLogin) {
      await this.registrarFalha(aluno.idAluno);
      throw new UnauthorizedException(MSG_TELEFONE_NAO_CONFERE);
    }

    // `pinHash: null` no where: duas requisições simultâneas não criam dois PINs
    const { count } = await this.prisma.aluno.updateMany({
      where: { idAluno: aluno.idAluno, pinHash: null },
      data: {
        pinHash: await bcrypt.hash(dto.pin, 10),
        pinTentativas: 0,
        pinBloqueadoAte: null,
      },
    });
    if (count === 0) {
      throw new ConflictException(MSG_PIN_JA_CRIADO);
    }

    return { ...this.montarConta(aluno), idProtocolo };
  }

  // Devolve uma conta por cadastro de aluno em que telefone e PIN batem: o
  // mesmo telefone pode estar com mais de um treinador, e o aluno escolhe.
  async login(dto: LoginAlunoDto) {
    const telefoneLogin = normalizarTelefone(dto.telefone);
    const candidatos: AlunoComProfissional[] = telefoneLogin
      ? await this.prisma.aluno.findMany({
          where: { telefoneLogin, pinHash: { not: null } },
          include: { profissional: { select: PROFISSIONAL_SELECT } },
        })
      : [];

    if (candidatos.length === 0) {
      await bcrypt.compare(dto.pin, DUMMY_PIN_HASH);
      this.registrarFalhaDesconhecido(telefoneLogin ?? dto.telefone);
      throw new UnauthorizedException(MSG_CREDENCIAIS);
    }

    const liberados = candidatos.filter((a) => !this.estaBloqueado(a));
    if (liberados.length === 0) {
      throw this.erroBloqueado();
    }

    const conferidos = await Promise.all(
      liberados.map(async (aluno) => ({
        aluno,
        ok: await bcrypt.compare(dto.pin, aluno.pinHash as string),
      })),
    );
    const corretos = conferidos.filter((c) => c.ok).map((c) => c.aluno);

    // Só conta erro quando o PIN não serve para nenhum cadastro: quem tem
    // PINs diferentes com dois treinadores não pode bloquear um ao entrar no outro.
    if (corretos.length === 0) {
      await Promise.all(liberados.map((a) => this.registrarFalha(a.idAluno)));
      throw new UnauthorizedException(MSG_CREDENCIAIS);
    }

    await this.prisma.aluno.updateMany({
      where: {
        idAluno: { in: corretos.map((a) => a.idAluno) },
        pinTentativas: { gt: 0 },
      },
      data: { pinTentativas: 0 },
    });

    return { contas: corretos.map((a) => this.montarConta(a)) };
  }

  emitirToken(aluno: { idAluno: number; versaoToken: number }): string {
    const payload: JwtPayloadAluno = {
      sub: aluno.idAluno,
      tipo: 'aluno',
      ver: aluno.versaoToken,
    };
    return this.jwtService.sign(payload);
  }

  // Token novo quando o atual está perto de vencer; undefined caso contrário
  renovarSeNecessario(aluno: AlunoLogado): string | undefined {
    const restante = aluno.tokenExp - Math.floor(Date.now() / 1000);
    return restante < RENOVAR_SE_FALTAR_MENOS_DE_SEG
      ? this.emitirToken(aluno)
      : undefined;
  }

  private montarConta(aluno: AlunoComProfissional) {
    return {
      accessToken: this.emitirToken(aluno),
      aluno: { idAluno: aluno.idAluno, nome: aluno.nome },
      profissional: aluno.profissional,
    };
  }

  private estaBloqueado(aluno: { pinBloqueadoAte: Date | null }): boolean {
    return !!aluno.pinBloqueadoAte && aluno.pinBloqueadoAte > new Date();
  }

  private erroBloqueado() {
    return new HttpException(MSG_BLOQUEADO, HttpStatus.TOO_MANY_REQUESTS);
  }

  private async registrarFalha(idAluno: number) {
    const { pinTentativas } = await this.prisma.aluno.update({
      where: { idAluno },
      data: { pinTentativas: { increment: 1 } },
      select: { pinTentativas: true },
    });
    if (pinTentativas >= MAX_TENTATIVAS_PIN) {
      await this.prisma.aluno.update({
        where: { idAluno },
        data: {
          pinTentativas: 0,
          pinBloqueadoAte: new Date(Date.now() + BLOQUEIO_PIN_MS),
        },
      });
    }
  }

  private registrarFalhaDesconhecido(telefone: string) {
    const agora = Date.now();
    const registro = this.tentativasDesconhecidos.get(telefone);
    if (registro && registro.bloqueadoAte > agora) {
      throw this.erroBloqueado();
    }

    // Teto de memória: números aleatórios não podem fazer o mapa crescer sem fim
    if (this.tentativasDesconhecidos.size >= 5000) {
      this.tentativasDesconhecidos.clear();
    }

    const tentativas = (registro?.tentativas ?? 0) + 1;
    this.tentativasDesconhecidos.set(
      telefone,
      tentativas >= MAX_TENTATIVAS_PIN
        ? { tentativas: 0, bloqueadoAte: agora + BLOQUEIO_PIN_MS }
        : { tentativas, bloqueadoAte: 0 },
    );
  }
}
