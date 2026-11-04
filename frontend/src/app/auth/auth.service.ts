import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { TOKEN_KEY, USER_KEY, getToken, getTokenExpiration, isTokenExpired } from '../core/token';
import { User, LoginRequest, LoginResponse, House } from '../shared/models';

/** setTimeout no admite más de ~24,8 días. */
const MAX_TIMEOUT_MS = 2_147_483_647;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private currentHouseSubject = new BehaviorSubject<House | null>(null);
  public currentHouse$ = this.currentHouseSubject.asObservable();

  private expiryTimer: ReturnType<typeof setTimeout> | null = null;
  /** true si al abrir la app había una sesión guardada que ya estaba vencida. */
  private expiredOnLoad = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private zone: NgZone
  ) {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    const token = getToken();
    if (!token || isTokenExpired(token)) {
      this.expiredOnLoad = !!token;
      // Sesión vencida o corrupta guardada de antes: se descarta sin redirigir
      // (el guard se encarga de mandar al login si hace falta).
      this.clearSession();
      return;
    }

    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        this.currentUserSubject.next(JSON.parse(userStr));
      }
    } catch {
      this.clearSession();
      return;
    }
    this.scheduleExpiry(token);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('auth/login', credentials).pipe(
      tap(response => {
        this.expiredOnLoad = false;
        localStorage.setItem(TOKEN_KEY, response.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
        this.scheduleExpiry(response.access_token);
      })
    );
  }

  /**
   * Cierra la sesión. Con reason 'expired' el login muestra el aviso de sesión expirada.
   * Es idempotente: varias respuestas 401 simultáneas solo redirigen una vez.
   */
  logout(reason?: 'expired'): void {
    const hadSession = !!getToken() || !!this.currentUserSubject.value;
    this.clearSession();

    if (reason === 'expired') {
      if (!hadSession) return;
      this.router.navigate(['/login'], { queryParams: { expired: 1 } });
    } else {
      this.router.navigate(['/login']);
    }
  }

  /** Devuelve (una sola vez) si la sesión guardada estaba vencida al abrir la app. */
  consumeExpiredOnLoad(): boolean {
    const value = this.expiredOnLoad;
    this.expiredOnLoad = false;
    return value;
  }

  isAuthenticated(): boolean {
    const token = getToken();
    return !!token && !isTokenExpired(token);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isSuperAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'super_admin';
  }

  isHouseAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin_house';
  }

  getHouseId(): string | null {
    const user = this.getCurrentUser();
    return user?.houseId || null;
  }

  canManageUsers(): boolean {
    return this.isHouseAdmin() || this.isSuperAdmin();
  }

  private clearSession(): void {
    if (this.expiryTimer) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // localStorage no disponible: no hay nada que limpiar
    }
    this.currentUserSubject.next(null);
  }

  /** Cierra la sesión automáticamente en cuanto vence el token, aunque la app esté abierta. */
  private scheduleExpiry(token: string): void {
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    this.expiryTimer = null;

    const exp = getTokenExpiration(token);
    if (exp === null) return;

    const delay = Math.min(Math.max(exp - Date.now(), 0), MAX_TIMEOUT_MS);
    // Fuera de la zona de Angular para no mantener la app "inestable" durante horas.
    this.zone.runOutsideAngular(() => {
      this.expiryTimer = setTimeout(() => {
        this.zone.run(() => this.logout('expired'));
      }, delay);
    });
  }
}
