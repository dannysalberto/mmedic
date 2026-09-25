import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import express, { Express } from 'express';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

const server: Express = express();
let isAppInitialized = false;

export async function createNestServer(expressInstance: Express) {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );

  // Enable CORS for Next.js Web and Mobile Apps
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global API Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filters (Prisma pool & constraint handling + Global DB logging per Constitución 1.4)
  const prismaService = app.get(PrismaService);
  app.useGlobalFilters(
    new GlobalExceptionFilter(prismaService),
    new PrismaExceptionFilter(),
  );

  // Global Multi-Tenant Interceptor (Constitución 2.3)
  app.useGlobalInterceptors(new TenantInterceptor());

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('MMedic REST API')
    .setDescription('Backend REST API para la plataforma médica MMedic (Web, Android, PostgreSQL)')
    .setVersion('1.0.0')
    .addTag('Health', 'Estado de salud del servicio y base de datos')
    .addTag('Patients', 'Gestión de pacientes e historial médico')
    .addTag('Appointments', 'Gestión y agenda de citas médicas')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  return app;
}

// Standalone mode for local development, Docker, or traditional environments
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  await createNestServer(server);
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    logger.log(`🚀 MMedic API is running on: http://localhost:${port}/api/v1`);
    logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
  });
}

if (!process.env.VERCEL) {
  bootstrap();
}

// Serverless handler for Vercel
export default async function handler(req: any, res: any) {
  if (!isAppInitialized) {
    await createNestServer(server);
    isAppInitialized = true;
  }
  return server(req, res);
}

