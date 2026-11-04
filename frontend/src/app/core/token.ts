export const TOKEN_KEY = 'access_token';
export const USER_KEY = 'current_user';

/** Margen para considerar vencido un token un poco antes de su expiración real. */
const EXPIRY_SKEW_MS = 10_000;

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

/** Fecha de expiración (ms) del JWT, o null si no tiene `exp`. */
export function getTokenExpiration(token: string): number | null {
  const exp = decodePayload(token)?.['exp'];
  return typeof exp === 'number' ? exp * 1000 : null;
}

/** Un token ilegible se trata como vencido; uno sin `exp` se considera vigente. */
export function isTokenExpired(token: string): boolean {
  if (!decodePayload(token)) return true;
  const exp = getTokenExpiration(token);
  return exp !== null && Date.now() >= exp - EXPIRY_SKEW_MS;
}
