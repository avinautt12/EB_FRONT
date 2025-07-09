import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const ruta = route.routeConfig?.path || '';

  const rutasPublicas = ['', 'login', 
    'recuperacion/enviar-correo', 
    'recuperacion/verificar-codigo', 
    'recuperacion/restablecer-contrasena'];

  if (token) {
    // Si quiere entrar a una ruta pública estando logueado
    if (rutasPublicas.includes(ruta)) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.rol === 1) {
          router.navigate(['/home']);
        } else if (decoded.rol === 2) {
          router.navigate(['/usuarios/dashboard']);
        } else {
          router.navigate(['/login']);
        }
        return false;
      } catch (e) {
        router.navigate(['/login']);
        return false;
      }
    }

    return true; // puede acceder a rutas protegidas
  } else {
    // No está logueado
    if (rutasPublicas.includes(ruta)) {
      return true;
    }

    router.navigate(['/login']);
    return false;
  }
};
