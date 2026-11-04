import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injector, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { getToken } from './token';

/**
 * - Agrega el header Authorization a las peticiones hacia nuestra API.
 * - Si la API responde 401 (token vencido, inválido o usuario desactivado), cierra la
 *   sesión y lleva al login con el aviso de sesión expirada.
 *   El 401 del propio login (credenciales incorrectas) se deja pasar al formulario.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // inject() solo funciona aquí (contexto síncrono); AuthService se resuelve de forma
  // diferida en el catchError para no crear una dependencia circular con HttpClient.
  const injector = inject(Injector);
  const isApiRequest = req.url.startsWith(environment.apiUrl);
  const isLoginRequest = isApiRequest && req.url.endsWith('/auth/login');
  const token = getToken();

  const request =
    isApiRequest && token && !isLoginRequest
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && isApiRequest && !isLoginRequest) {
        injector.get(AuthService).logout('expired');
      }
      return throwError(() => error);
    }),
  );
};
