import { importProvidersFrom } from '@angular/core';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

export const appConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        (req, next) => {
          const token = localStorage.getItem('token');
          if (token) {
            const authReq = req.clone({
              headers: req.headers.set('Authorization', `Bearer ${token}`)
            });
            return next(authReq);
          }
          return next(req);
        }
      ])
    ),
    importProvidersFrom(RouterModule.forRoot(routes))
  ]
};
