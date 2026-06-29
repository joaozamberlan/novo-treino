import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { DEFAULT_CATALOG, DEFAULT_TECNICAS } from '../constants/default-catalog';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    await this.seedAdmin();
  }

  private async seedAdmin() {
    const adminEmail = 'admin@treinosapp.com';
    const exists = await this.profissional.findUnique({
      where: { email: adminEmail },
    });

    if (!exists) {
      const salt = await bcrypt.genSalt(10);
      const senhaHash = await bcrypt.hash('admin123', salt);

      const admin = await this.profissional.create({
        data: {
          nome: 'Administrador TreinosApp',
          email: adminEmail,
          senhaHash,
          cref: '000000-G/ADMIN',
          profissao: 'Administrador',
          ativo: true,
          role: 'SUPERADMIN',
        },
      });
      console.log('--- ADMIN ACCOUNT SEEDED AUTOMATICALLY: admin@treinosapp.com / admin123 ---');
      
      // Seed isolated catalog for Admin
      await this.seedAdminCatalog(admin.idProfissional);
    } else {
      // Force update existing admin account to SUPERADMIN role and active status
      await this.profissional.update({
        where: { email: adminEmail },
        data: {
          ativo: true,
          role: 'SUPERADMIN',
        },
      });
      console.log('--- ADMIN ACCOUNT UPDATED TO SUPERADMIN AUTOMATICALLY ---');
    }
  }

  private async seedAdminCatalog(idProfissional: number) {
    try {
      for (const [groupName, exercises] of Object.entries(DEFAULT_CATALOG)) {
        const group = await this.grupoMuscular.create({
          data: {
            nome: groupName,
            idProfissional
          }
        });

        for (const exName of exercises) {
          await this.exercicio.create({
            data: {
              nome: exName,
              idGrupoMuscular: group.idGrupoMuscular,
              idProfissional
            }
          });
        }
      }

      for (const tech of DEFAULT_TECNICAS) {
        await this.tecnicaTreino.create({
          data: {
            nome: tech.nome,
            descricao: tech.desc,
            idProfissional
          }
        });
      }
      console.log('--- ADMIN CATALOG SEEDED AUTOMATICALLY ---');
    } catch (err) {
      console.error('Falha ao semear catálogo inicial do Admin:', err);
    }
  }
}
