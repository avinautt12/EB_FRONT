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

  // GUÍA: rutas de usuarioGuard donde el staff interno (rol 1) también puede
  // entrar, además de clientes (rol 2). Se agregó porque el botón de
  // "Solicitud de retroactivos" vive en el monitor admin (dashboard-retroactivos)
  // y el equipo quiere poder abrir el formulario desde ahí. Ojo: el formulario
  // toma el id_usuario del token logueado, así que si un admin lo llena, la
  // venta queda registrada a nombre del admin, no del cliente real.
  const rutasUsuarioYAdmin = [
    'usuarios/solicitud-retroactivo',
    'usuarios/solicitud-retroactivo/formulario',
    'usuarios/solicitud-retroactivo/seguimiento'
  ];

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

    // GUÍA: excepción puntual para el staff interno en las rutas listadas
    // arriba (ver rutasUsuarioYAdmin). Fuera de esa lista, el admin sigue
    // sin poder entrar a rutas de usuario.
    if (decodedToken.rol === 1 && rutasUsuarioYAdmin.includes(ruta)) {
      return true;
    }

    // Si es Admin (rol 1) intenta acceder a otra ruta de Usuario
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