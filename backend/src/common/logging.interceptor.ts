import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  // No se registran headers ni bodies: contienen tokens JWT y datos personales.
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, url } = request;
    const path = (originalUrl || url || '').split('?')[0];
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${method} ${path} ${Date.now() - start}ms`),
        error: (err) =>
          this.logger.warn(`${method} ${path} ${err?.status ?? 500} ${Date.now() - start}ms`),
      }),
    );
  }
}
