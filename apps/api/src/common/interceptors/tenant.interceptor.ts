import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

export interface TenantContext {
  tenantId: string;
  isSuperAdmin: boolean;
}

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const isSuperAdmin = user?.role === 'ROL_SUPERADMIN';
    // Si es superadmin, permite sobreescribir con cabecera 'x-tenant-id' para gestión administrativa
    const tenantId =
      (isSuperAdmin && request.headers['x-tenant-id']) ||
      user?.tenantId ||
      request.headers['x-tenant-id'] ||
      'default-clinic';

    request.tenantContext = {
      tenantId,
      isSuperAdmin,
    } as TenantContext;

    return next.handle();
  }
}
