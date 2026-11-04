import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      // Check if route requires super admin
      if (route.data['requiresSuperAdmin'] && !this.authService.isSuperAdmin()) {
        this.router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }

    const queryParams: Record<string, string | number> = { returnUrl: state.url };
    if (this.authService.consumeExpiredOnLoad()) {
      queryParams['expired'] = 1;
    }
    this.router.navigate(['/login'], { queryParams });
    return false;
  }
}
