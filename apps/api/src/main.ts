import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

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

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 MMedic API is running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
