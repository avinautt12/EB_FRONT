import { Routes } from '@angular/router';
import { InicioComponent } from './views/inicio/inicio.component';
import { LoginComponent } from './views/login/login.component';
import { HomeComponent } from './views/home/home.component';
import { MonitorComponent } from './views/internal-views/monitor/monitor.component';
import { UsuariosComponent } from './views/internal-views/usuarios/usuarios.component';
import { EnviarCorreoComponent } from './views/recuperacion/enviar-correo/enviar-correo.component';
import { VerificarCodigoComponent } from './views/recuperacion/verificar-codigo/verificar-codigo.component';
import { RestablecerContrasenaComponent } from './views/recuperacion/restablecer-contrasena/restablecer-contrasena.component';

import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: InicioComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent, canActivate: [authGuard] },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'monitor', component: MonitorComponent, canActivate: [authGuard] },
  { path: 'usuarios', component: UsuariosComponent, canActivate: [authGuard] },
  { path: 'recuperacion/enviar-correo', component: EnviarCorreoComponent},
  { path: 'recuperacion/verificar-codigo', component: VerificarCodigoComponent},
  { path: 'recuperacion/restablecer-contrasena', component: RestablecerContrasenaComponent},
  { path: '**', redirectTo: '' }
];
