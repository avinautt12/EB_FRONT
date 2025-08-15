import { Routes } from '@angular/router';
import { InicioComponent } from './views/inicio/inicio.component';
import { LoginComponent } from './views/login/login.component';
import { HomeComponent } from './views/home/home.component';
import { MonitorComponent } from './views/internal-views/monitor/monitor.component';
import { UsuariosComponent } from './views/internal-views/usuarios/usuarios.component';
import { EnviarCorreoComponent } from './views/recuperacion/enviar-correo/enviar-correo.component';
import { VerificarCodigoComponent } from './views/recuperacion/verificar-codigo/verificar-codigo.component';
import { RestablecerContrasenaComponent } from './views/recuperacion/restablecer-contrasena/restablecer-contrasena.component';
import { PrevioComponent } from './views/internal-views/previo/previo.component';
import { MultimarcasComponent } from './views/internal-views/multimarcas/multimarcas.component';
import { CaratulasComponent } from './views/internal-views/caratulas/caratulas.component';
import { CaratulaEvacAComponent } from './views/internal-views/caratula-evac-a/caratula-evac-a.component';
import { CaratulaEvacBComponent } from './views/internal-views/caratula-evac-b/caratula-evac-b.component';
import { MetasComponent } from './views/internal-views/metas/metas.component';
import { DistribuidoresComponent } from './views/internal-views/distribuidores/distribuidores.component';
import { DashboardComponent } from './views/usuarios/dashboard/dashboard.component';
import { ProyeccionComponent } from './views/internal-views/proyeccion/proyeccion.component';
import { ProyeccionUsuariosComponent } from './views/usuarios/proyeccion-usuarios/proyeccion-usuarios.component';
import { CrearProyeccionUsuariosComponent } from './views/usuarios/crear-proyeccion-usuarios/crear-proyeccion-usuarios.component';
import { ProyeccionHistorialComponent } from './views/usuarios/proyeccion-historial/proyeccion-historial.component';
import { ProyeccionDetallesComponent } from './views/internal-views/proyeccion-detalles/proyeccion-detalles.component';
import { ProyeccionControlComponent } from './views/internal-views/proyeccion-control/proyeccion-control.component';
import { DistribuidoresMultimarcasComponent } from './views/internal-views/distribuidores-multimarcas/distribuidores-multimarcas.component';
import { InicioCaratulasComponent } from './views/internal-views/inicio-caratulas/inicio-caratulas.component';

import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { usuarioGuard } from './guards/usuario.guard';

export const routes: Routes = [
  { path: '', component: InicioComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent, canActivate: [authGuard] },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'monitor', component: MonitorComponent, canActivate: [authGuard] },
  { path: 'previo', component: PrevioComponent, canActivate: [authGuard] },
  { path: 'multimarcas', component: MultimarcasComponent, canActivate: [authGuard] },
  { path: 'metas', component: MetasComponent, canActivate: [authGuard] },
  { path: 'distribuidores', component: DistribuidoresComponent, canActivate: [authGuard] },
  { path: 'distribuidores-multimarcas', component: DistribuidoresMultimarcasComponent, canActivate: [authGuard] },
  { path: 'caratulas', component: CaratulasComponent, canActivate: [authGuard] },
  { path: 'inicio-caratulas', component: InicioCaratulasComponent, canActivate: [authGuard] },
  { path: 'caratula-evac-a', component: CaratulaEvacAComponent, canActivate: [authGuard] },
  { path: 'caratula-evac-b', component: CaratulaEvacBComponent, canActivate: [authGuard] },
  { path: 'usuarios', component: UsuariosComponent, canActivate: [authGuard] },
  { path: 'proyeccion', component: ProyeccionComponent, canActivate: [authGuard] },
  { path: 'proyeccion/detalles/:id', component: ProyeccionDetallesComponent, canActivate: [authGuard] },
  { path: 'proyeccion/control', component: ProyeccionControlComponent, canActivate: [authGuard] },
  { path: 'recuperacion/enviar-correo', component: EnviarCorreoComponent},
  { path: 'recuperacion/verificar-codigo', component: VerificarCodigoComponent},
  { path: 'recuperacion/restablecer-contrasena', component: RestablecerContrasenaComponent},
  { path: 'usuarios/dashboard', component: DashboardComponent, canActivate: [usuarioGuard] },
  { path: 'usuarios/proyeccion-compras', component: ProyeccionUsuariosComponent, canActivate: [usuarioGuard] },
  { path: 'usuarios/crear-proyeccion', component: CrearProyeccionUsuariosComponent, canActivate: [usuarioGuard] },
  { path: 'usuarios/proyeccion-historial', component: ProyeccionHistorialComponent, canActivate: [usuarioGuard] },
  { path: '**', redirectTo: '' }
];
