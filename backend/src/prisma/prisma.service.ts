import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import {
  DEFAULT_CATALOG,
  DEFAULT_TECNICAS,
} from '../constants/default-catalog';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      keepAlive: true,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    await this.seedAdminIfEnabled();
  }

  /**
   * Seed opcional de uma conta SUPERADMIN para ambiente de desenvolvimento local.
   *
   * Nunca roda em produção por padrão: exige SEED_ADMIN=true explicitamente, e as
   * credenciais vêm de variáveis de ambiente definidas pelo próprio desenvolvedor
   * (nunca fixas no código). Só cria a conta se ela ainda não existir — nunca
   * sobrescreve role/status de uma conta já existente durante o boot.
   */
  private async seedAdminIfEnabled() {
    if (process.env.SEED_ADMIN !== 'true') {
      return;
    }

    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn(
        'SEED_ADMIN=true, mas SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD não foram definidos. Seed de admin ignorado.',
      );
      return;
    }

    if (adminPassword.length < 8) {
      console.warn(
        'SEED_ADMIN_PASSWORD é muito curta (mínimo 8 caracteres). Seed de admin ignorado.',
      );
      return;
    }

    const exists = await this.profissional.findUnique({
      where: { email: adminEmail },
    });
    if (exists) {
      // Nunca sobrescreve uma conta já existente durante o boot.
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(adminPassword, salt);

    const admin = await this.profissional.create({
      data: {
        nome: 'Administrador (dev)',
        email: adminEmail,
        senhaHash,
        cref: '000000-G/ADMIN',
        profissao: 'Administrador',
        ativo: true,
        role: 'SUPERADMIN',
      },
    });

    console.log(
      'Conta SUPERADMIN de desenvolvimento criada a partir de SEED_ADMIN_EMAIL (credenciais não exibidas no log).',
    );

    await this.seedAdminCatalog(admin.idProfissional);
  }

  private async seedAdminCatalog(idProfissional: number) {
    try {
      for (const [groupName, exercises] of Object.entries(DEFAULT_CATALOG)) {
        const group = await this.grupoMuscular.create({
          data: {
            nome: groupName,
            idProfissional,
          },
        });

        for (const exName of exercises) {
          await this.exercicio.create({
            data: {
              nome: exName,
              idGrupoMuscular: group.idGrupoMuscular,
              idProfissional,
            },
          });
        }
      }

      for (const tech of DEFAULT_TECNICAS) {
        await this.tecnicaTreino.create({
          data: {
            nome: tech.nome,
            descricao: tech.desc,
            idProfissional,
          },
        });
      }
      console.log('--- ADMIN CATALOG SEEDED AUTOMATICALLY ---');
    } catch (err) {
      console.error('Falha ao semear catálogo inicial do Admin:', err);
    }
  }
}
