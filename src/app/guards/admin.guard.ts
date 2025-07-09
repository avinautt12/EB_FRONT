import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const ruta = route.routeConfig?.path || '';

  const rutasPublicas = ['', 'login', 
    'recuperacion/enviar-correo', 
    'recuperacion/verificar-codigo', 
    'recuperacion/restablecer-contrasena'];

  if (!token) {
    // Si no hay token, permitimos solo rutas públicas
    if (rutasPublicas.includes(ruta)) {
      return true;
    } else {
      router.navigate(['/login']);
      return false;
    }
  }

  try {
    const decodedToken: any = jwtDecode(token);

    if (decodedToken.rol === 1) {
      // Admin, puede acceder
      return true;
    } else {
      // No es admin, redirigimos a su dashboard
      router.navigate(['/usuarios/dashboard']);
      return false;
    }
  } catch (error) {
    console.error('Token inválido o error al decodificar:', error);
    router.navigate(['/login']);
    return false;
  }
};
