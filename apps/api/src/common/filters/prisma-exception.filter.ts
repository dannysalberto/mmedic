import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientInitializationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientInitializationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Prisma error code P2024: Timed out fetching a new connection from the connection pool
    if (
      ('code' in exception && exception.code === 'P2024') ||
      exception.message.includes('Timed out fetching a new connection from the connection pool')
    ) {
      this.logger.warn(
        `[Pool Saturation] ${request.method} ${request.url} - Connection pool acquisition timed out after 5s. Returning HTTP 503.`,
      );

      response.setHeader('Retry-After', '5');
      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        success: false,
        data: null,
        message:
          'Servicio temporalmente no disponible debido a alta demanda de conexiones. Por favor intente nuevamente en unos instantes.',
        code: 'CONNECTION_POOL_SATURATED',
        timestamp: new Date().toISOString(),
      });
    }

    // P2002: Unique constraint violation
    if ('code' in exception && exception.code === 'P2002') {
      const targets = (exception.meta?.target as string[]) || [];
      const field = targets.join(', ') || 'recurso';
      return response.status(HttpStatus.CONFLICT).json({
        success: false,
        data: null,
        message: `Ya existe un registro con el mismo valor para: ${field}`,
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        timestamp: new Date().toISOString(),
      });
    }

    // P2025: Record not found
    if ('code' in exception && exception.code === 'P2025') {
      return response.status(HttpStatus.NOT_FOUND).json({
        success: false,
        data: null,
        message: (exception.meta?.cause as string) || 'El registro solicitado no fue encontrado',
        code: 'RECORD_NOT_FOUND',
        timestamp: new Date().toISOString(),
      });
    }

    // Other Prisma errors: 500 internal server error
    this.logger.error(
      `[Prisma Error ${('code' in exception && exception.code) || 'Init'}] ${request.method} ${request.url}: ${exception.message}`,
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      data: null,
      message: 'Ocurrió un error al procesar la operación en la base de datos',
      code: ('code' in exception && exception.code) || 'DATABASE_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
}
