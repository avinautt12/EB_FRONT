import { importProvidersFrom, LOCALE_ID, inject } from '@angular/core';
import { provideRouter, RouterModule, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import {
  provideHttpClient,
  withInterceptors,
  withFetch,
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn
} from '@angular/common/http';

import { registerLocaleData } from '@angular/common';
import localeEsMx from '@angular/common/locales/es-MX';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

registerLocaleData(localeEsMx, 'es-MX');

let _renovando = false;

const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = localStorage.getItem('token');
  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError(err => {
      const esRuta401 = err.status === 401;
      const esRenovacion = req.url.includes('/renovar_token');
      const esLogin = req.url.includes('/login');

      if (esRuta401 && !esRenovacion && !esLogin && !_renovando) {
        _renovando = true;
        return authService.renovarToken().pipe(
          switchMap(res => {
            _renovando = false;
            authService.setToken(res.token);
            const retryReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${res.token}`)
            });
            return next(retryReq);
          }),
          catchError(refreshErr => {
            _renovando = false;
            authService.clearToken();
            router.navigate(['/login'], { queryParams: { expirado: '1' } });
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};

export const appConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'disabled' })),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(RouterModule.forRoot(routes)),
    { provide: LOCALE_ID, useValue: 'es-MX' }
  ]
};
