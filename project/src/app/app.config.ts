import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

const API_PREFIX = '/api'; // matches your proxy

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        (req, next) => {
          const isAbsolute = /^https?:\/\//i.test(req.url);

          // Get token from your storage (adjust if you use a service)
          const token = localStorage.getItem('access_token') ?? undefined;

          // Headers for same-origin (proxied) calls
          let headers = req.headers;
          if (!isAbsolute) {
            headers = headers.set('User-TimeZone', Intl.DateTimeFormat().resolvedOptions().timeZone);
          }
          if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
          }

          // Prefix relative URLs with /api (but not assets)
          const shouldPrefix =
            !isAbsolute && !req.url.startsWith(API_PREFIX) && !req.url.startsWith('/assets');
          const url = shouldPrefix ? `${API_PREFIX}/${req.url.replace(/^\/+/, '')}` : req.url;

          return next(req.clone({ headers, url }));
        }
      ])
    )
  ]
};
