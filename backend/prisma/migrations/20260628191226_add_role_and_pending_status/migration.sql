-- AlterTable
ALTER TABLE "Profissional" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'USER',
ALTER COLUMN "ativo" SET DEFAULT false;
