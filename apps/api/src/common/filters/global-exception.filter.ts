import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly prisma?: PrismaService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as any)?.message || exception.message
        : (exception as Error)?.message || 'Internal server error';

    const errorType =
      exception instanceof HttpException
        ? exception.constructor.name
        : (exception as Error)?.name || 'UnhandledException';

    const stack = (exception as Error)?.stack || '';
    const { fileName, lineNumber } = this.extractCallerLocation(stack);

    const user = (request as any)?.user;
    const userId = user?.id || user?.sub || 'ANONYMOUS';

    // Persistencia asíncrona obligatoria en base de datos (Constitución 1.4)
    if (this.prisma) {
      this.prisma.systemErrorLog
        .create({
          data: {
            fileName,
            lineNumber,
            errorMessage: Array.isArray(message) ? message.join('; ') : String(message),
            errorDescription: stack.substring(0, 4000),
            userId: String(userId),
            errorType,
          },
        })
        .catch((dbErr) => {
          this.logger.error(
            `Fallo al registrar traza en SystemErrorLog: ${dbErr.message}`,
          );
        });
    }

    this.logger.error(
      `[${errorType}] ${request.method} ${request.url} - ${Array.isArray(message) ? message.join(', ') : message} (${fileName}:${lineNumber})`,
    );

    response.status(status).json({
      success: false,
      data: null,
      message: Array.isArray(message) ? message.join(', ') : String(message),
      timestamp: new Date().toISOString(),
    });
  }

  private extractCallerLocation(stack: string): { fileName: string; lineNumber: number } {
    if (!stack) return { fileName: 'unknown', lineNumber: 0 };
    const lines = stack.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('node_modules') || line.includes('internal/')) continue;
      const match = line.match(/\((.+?):(\d+):(\d+)\)/) || line.match(/at (.+?):(\d+):(\d+)/);
      if (match) {
        const fullPath = match[1].replace(/\\/g, '/');
        const fileName = fullPath.split('/').slice(-2).join('/');
        const lineNumber = parseInt(match[2], 10) || 0;
        return { fileName, lineNumber };
      }
    }
    return { fileName: 'unknown', lineNumber: 0 };
  }
}
