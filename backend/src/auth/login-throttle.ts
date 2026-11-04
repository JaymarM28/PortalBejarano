import { ThrottlerModule } from '@nestjs/throttler';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

/**
 * Límite de intentos para login. Solo se aplica en las rutas que usan ThrottlerGuard
 * (login y register); el resto de la API no se ve afectado.
 *
 * - login-account: máx. 10 intentos cada 15 min por email, venga de la IP que venga
 *   (frena fuerza bruta distribuida contra una cuenta).
 * - login-ip: máx. 30 intentos cada 15 min por IP (frena probar muchos emails).
 *   Si el backend está detrás de un proxy, define TRUST_PROXY para que se use la IP real.
 */
export const LoginThrottlerModule = ThrottlerModule.forRoot({
  errorMessage: 'Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.',
  throttlers: [
    {
      name: 'login-account',
      ttl: FIFTEEN_MINUTES,
      limit: 10,
      getTracker: (req: Record<string, any>) =>
        String(req.body?.email ?? '').trim().toLowerCase() || req.ip,
    },
    {
      name: 'login-ip',
      ttl: FIFTEEN_MINUTES,
      limit: 30,
      getTracker: (req: Record<string, any>) => req.ip,
    },
  ],
});
