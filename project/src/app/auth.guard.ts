// src/app/common/guards/auth.guards.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from '#common/services/auth.service';

// Use on feature routes with data: { allow: ['ADMIN'] } or { allow: true }
export const authoritiesGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const data = route.data as { allow?: boolean | Role | Role[] } | undefined;
  
  if (!data?.allow) return true;
  if (typeof data.allow === 'boolean') return data.allow;
  
  if (auth.hasRole(data.allow)) return true;
  return inject(Router).parseUrl('/main');
};

// Ensures a valid session (token present, user loaded) or redirects to /login
export const sessionGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isLoginRoute = route.routeConfig?.path === 'login';
  const hasToken = !!auth.token;

  if (!hasToken) {
    return isLoginRoute ? true : router.parseUrl(`/login?returnUrl=${encodeURIComponent(state.url)}`);
  }

  // token exists; we consider the session valid
  if (isLoginRoute) return router.parseUrl('/main');
  return true;
};
