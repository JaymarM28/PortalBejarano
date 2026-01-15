import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers } = request;
    
    console.log(`\n📥 ${method} ${url}`);
    console.log('📋 Headers:', {
      authorization: headers.authorization || '❌ NO TOKEN',
      'content-type': headers['content-type'],
    });
    
    return next.handle();
  }
}
