import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import helmet from 'helmet';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

// Origens permitidas por padrão quando CORS_ORIGIN não está configurado
// (ambiente de desenvolvimento local + domínio de produção conhecido).
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173',
  'https://novo-treino.vercel.app',
];

function resolveAllowedOrigins(): string[] {
  const configured = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_CORS_ORIGINS;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // A API roda atrás do proxy do Railway: sem isso req.ip é o IP do proxy e o
  // ThrottlerGuard conta todos os usuários no mesmo balde. Confia só no
  // primeiro hop (o proxy), então X-Forwarded-For não pode ser forjado.
  app.set('trust proxy', 1);

  // Helmet: headers de segurança HTTP padrão (X-Content-Type-Options, HSTS, etc).
  // crossOriginResourcePolicy precisa ficar em "cross-origin" porque o frontend
  // (Vercel) carrega imagens de /uploads a partir de uma origem diferente da API.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS restrito a uma allowlist — nunca reflete qualquer origem.
  // Requisições sem header Origin (apps mobile nativos, curl, server-to-server)
  // são permitidas, já que não são o vetor que CORS protege.
  const allowedOrigins = resolveAllowedOrigins();
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origem não permitida pelo CORS'), false);
    },
  });

  // Ensure uploads directory exists
  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static upload files
  app.use('/uploads', express.static(uploadsDir));

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Filtro global: padroniza respostas de erro e nunca expõe stack/SQL/paths ao cliente.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Log de acesso básico (método, rota, status, duração) — sem headers/body/tokens.
  app.useGlobalInterceptors(new LoggingInterceptor());

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Backend server running on port ${port}`);
  logger.log(`CORS origins permitidas: ${allowedOrigins.join(', ')}`);
}
bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('Falha ao iniciar a aplicação:', message);
  process.exit(1);
});
