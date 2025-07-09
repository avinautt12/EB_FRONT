import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

export const usuarioGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const ruta = route.routeConfig?.path || '';

  const rutasPublicas = ['', 'login', 
    'recuperacion/enviar-correo', 
    'recuperacion/verificar-codigo', 
    'recuperacion/restablecer-contrasena'];

  if (!token) {
    if (rutasPublicas.includes(ruta)) {
      return true;
    } else {
      router.navigate(['/login']);
      return false;
    }
  }

  try {
    const decodedToken: any = jwtDecode(token);

    if (decodedToken.rol === 2) {
      return true;
    } else {
      router.navigate(['/home']); // o donde quieras mandar al admin si entra a vista usuario
      return false;
    }
  } catch (error) {
    console.error('Token inválido o error al decodificar:', error);
    router.navigate(['/login']);
    return false;
  }
};
