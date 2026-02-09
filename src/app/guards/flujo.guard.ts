import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; 

export const flujoGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const permiso = auth.getFlujoPermiso();

  if (permiso === 1) {
    return true; 
  }
  
  router.navigate(['/flujo-dashboard']);
  return false;
};