import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const ruta = route.routeConfig?.path || '';

  const rutasPublicas = ['', 'login']; // rutas a las que puede ir si NO está logeado

  if (token) {
    // Si ya está logeado y quiere entrar a login o '', lo mandamos a /home
    if (rutasPublicas.includes(ruta)) {
      router.navigate(['/home']);
      return false;
    }
    return true; // puede acceder a cualquier ruta protegida
  } else {
    // Si no está logeado y trata de entrar a rutas públicas, lo dejamos
    if (rutasPublicas.includes(ruta)) {
      return true;
    }
    // Cualquier otra ruta requiere login
    router.navigate(['/login']);
    return false;
  }
};
