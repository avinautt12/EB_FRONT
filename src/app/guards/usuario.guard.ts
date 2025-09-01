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
    // No está logueado
    if (rutasPublicas.includes(ruta)) {
      return true;
    }
    router.navigate(['/login']);
    return false;
  }

  try {
    const decodedToken: any = jwtDecode(token);

    // Si está en ruta pública estando logueado, redirige según su rol
    if (rutasPublicas.includes(ruta)) {
      if (decodedToken.rol === 1) {
        router.navigate(['/home']);
      } else if (decodedToken.rol === 2) {
        router.navigate(['/usuarios/dashboard']);
      }
      return false;
    }

    // SOLO Usuario (rol 2) puede acceder a rutas protegidas por usuarioGuard
    if (decodedToken.rol === 2) {
      return true;
    }
    
    // Si es Admin (rol 1) intenta acceder a ruta de Usuario
    if (decodedToken.rol === 1) {
      router.navigate(['/home']);
      return false;
    }
    
    // Rol no reconocido
    localStorage.removeItem('token');
    router.navigate(['/login']);
    return false;
    
  } catch (error) {
    localStorage.removeItem('token');
    router.navigate(['/login']);
    return false;
  }
};