import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminSistemaService, ModuloItem, AccionBase, ModuloPayload } from '../../../services/admin-sistema.service';
import { TopBarUsuariosComponent } from '../../../components/top-bar-usuarios/top-bar-usuarios.component';

@Component({
  selector: 'app-catalogo-general',
  standalone: true,
  imports: [CommonModule, FormsModule, TopBarUsuariosComponent],
  templateUrl: './catalogo-general.component.html',
  styleUrl: './catalogo-general.component.css'
})
export class CatalogoGeneralComponent implements OnInit {
  private readonly adminService = inject(AdminSistemaService);

  cargando: boolean = false;
  alertMsj: string | null = null;
  alertTipo: 'success' | 'error' = 'success';

  modulos: ModuloItem[] = [];
  accionesGlobales: AccionBase[] = [];

  // Cambio de variable sin eñe (pestanaActiva)
  pestanaActiva: 'modulos' | 'acciones' = 'modulos';

  // Formulario Módulo
  modalModuloVisible: boolean = false;
  editandoModuloId: number | null = null;
  formNombreModulo: string = '';
  formIdentificadorModulo: string = '';
  formPadreIdModulo: number | null = null;
  formAccionesSeleccionadas: number[] = [];

  // Formulario Acción Base
  modalAccionVisible: boolean = false;
  formNombreAccion: string = '';
  formIdentificadorAccion: string = '';

  // Variable para controlar qué módulos raíz están expandidos
  modulosExpandidos = new Set<number>();

  ngOnInit(): void {
    this.cargarCatalogo();
  }

  cargarCatalogo(): void {
    this.cargando = true;
    this.adminService.getAcciones().subscribe({
      next: (resAcciones) => {
        this.accionesGlobales = resAcciones.acciones || [];
        
        this.adminService.getModulos().subscribe({
          next: (resModulos) => {
            this.modulos = resModulos.modulos || [];
            this.cargando = false;
          },
          error: () => {
            this.cargando = false;
            this.mostrarAlerta('Error al cargar módulos.', 'error');
          }
        });
      },
      error: () => {
        this.cargando = false;
        this.mostrarAlerta('Error al cargar catálogo de acciones base.', 'error');
      }
    });
  }

  /**
   * Genera la clave de permiso jerárquica (padre/submodulo/accion o modulo/accion)
   */
  getClavePermiso(accionId: number): string {
    const accion = this.accionesGlobales.find(a => a.id === accionId);
    const identAccion = accion ? accion.identificador : '';
    const identModulo = (this.formIdentificadorModulo || '').trim().toLowerCase();

    // Si hay un módulo padre seleccionado, anteponemos su identificador
    if (this.formPadreIdModulo) {
      const padre = this.modulos.find(m => m.id === this.formPadreIdModulo);
      if (padre && padre.identificador) {
        const identPadre = padre.identificador.trim().toLowerCase();
        return `${identPadre}/${identModulo}/${identAccion}`.toLowerCase();
      }
    }

    return `${identModulo}/${identAccion}`.toLowerCase();
  }

  /**
   * Copia el texto al portapapeles y emite notificación
   */
  copiarTexto(texto: string): void {
    navigator.clipboard.writeText(texto).then(() => {
      this.alertTipo = 'success';
      this.alertMsj = `Clave copiada al portapapeles: "${texto}"`;
      setTimeout(() => (this.alertMsj = null), 2500);
    });
  }

  /**
   * Alterna la expansión/colapso de un módulo raíz
   */
  toggleExpandir(id: number): void {
    if (this.modulosExpandidos.has(id)) {
      this.modulosExpandidos.delete(id);
    } else {
      this.modulosExpandidos.add(id);
    }
  }

  /**
   * Verifica si un módulo está expandido
   */
  isExpandido(id: number): boolean {
    return this.modulosExpandidos.has(id);
  }

  /**
   * Retorna únicamente los Módulos Raíz (padre_id es null/undefined)
   */
  get modulosRaiz(): any[] {
    return (this.modulos || []).filter(m => !m.padre_id);
  }

  /**
   * Retorna los submódulos pertenecientes a un Módulo Raíz específico
   */
  getSubmodulos(padreId: number): any[] {
    return (this.modulos || []).filter(m => m.padre_id === padreId);
  }

  // --- GESTIÓN DE MÓDULOS ---

  /**
   * Método adaptador para abrir el modal desde las llamadas de la plantilla
   */
  abrirModalModulo(m?: ModuloItem): void {
    if (m) {
      this.abrirModalEditarModulo(m);
    } else {
      this.abrirModalNuevoModulo();
    }
  }

  abrirModalNuevoModulo(): void {
    this.editandoModuloId = null;
    this.formNombreModulo = '';
    this.formIdentificadorModulo = '';
    this.formPadreIdModulo = null;
    this.formAccionesSeleccionadas = [];
    this.modalModuloVisible = true;
  }

  abrirModalEditarModulo(m: ModuloItem): void {
    this.editandoModuloId = m.id;
    this.formNombreModulo = m.nombre;
    this.formIdentificadorModulo = m.identificador;
    this.formPadreIdModulo = m.padre_id || null;
    this.formAccionesSeleccionadas = (m.acciones || []).map(a => a.id);
    this.modalModuloVisible = true;
  }

  cerrarModalModulo(): void {
    this.modalModuloVisible = false;
  }

  toggleAccionEnModulo(accionId: number): void {
    const index = this.formAccionesSeleccionadas.indexOf(accionId);
    if (index > -1) {
      this.formAccionesSeleccionadas.splice(index, 1);
    } else {
      this.formAccionesSeleccionadas.push(accionId);
    }
  }

  estaAccionSeleccionada(accionId: number): boolean {
    return this.formAccionesSeleccionadas.includes(accionId);
  }

  guardarModulo(): void {
    if (!this.formNombreModulo.trim() || !this.formIdentificadorModulo.trim()) {
      this.mostrarAlerta('Nombre e Identificador son obligatorios.', 'error');
      return;
    }

    const payload: ModuloPayload = {
      nombre: this.formNombreModulo.trim(),
      identificador: this.formIdentificadorModulo.trim(),
      padre_id: this.formPadreIdModulo,
      acciones_ids: this.formAccionesSeleccionadas
    };

    const peticion$ = this.editandoModuloId
      ? this.adminService.actualizarModulo(this.editandoModuloId, payload)
      : this.adminService.crearModulo(payload);

    peticion$.subscribe({
      next: () => {
        this.mostrarAlerta(this.editandoModuloId ? 'Módulo actualizado.' : 'Módulo creado.', 'success');
        this.cerrarModalModulo();
        this.cargarCatalogo();
      },
      error: (err) => this.mostrarAlerta(err.error?.error || 'Error al guardar el módulo.', 'error')
    });
  }

  /**
   * Alterna el estado activo/inactivo del módulo tolerando booleanos o números
  */
  toggleEstadoModulo(m: ModuloItem): void {
    if (!m) return;
    // Evalúa si m.activo es 1 o true
    const estaActivo = m.activo === 1 || (m as any).activo === true;
    const nuevoEstado = estaActivo ? 0 : 1;
    this.cambiarEstadoModulo(m, nuevoEstado);
  }

  cambiarEstadoModulo(m: ModuloItem, activo: number): void {
    this.adminService.cambiarEstadoModulo(m.id, activo).subscribe({
      next: () => {
        m.activo = activo;
        this.mostrarAlerta(`Módulo ${activo === 1 ? 'activado' : 'desactivado'}.`, 'success');
      },
      error: (err) => {
        const msj = err.error?.error || err.error?.mensaje || err.message || 'Error al cambiar el estado.';
        this.mostrarAlerta(msj, 'error');
      }
    });
  }

  /**
   * Acepta tanto el objeto ModuloItem completo como únicamente su ID numérico
   */
  eliminarModulo(target: ModuloItem | number): void {
    const m = typeof target === 'number' 
      ? this.modulos.find(item => item.id === target) 
      : target;

    if (!m) return;

    if (!confirm(`¿Eliminar permanentemente el módulo "${m.nombre}" y sus relaciones?`)) return;

    this.adminService.eliminarModulo(m.id).subscribe({
      next: () => {
        this.mostrarAlerta('Módulo eliminado correctamente.', 'success');
        this.cargarCatalogo();
      },
      error: () => this.mostrarAlerta('Error al eliminar el módulo.', 'error')
    });
  }

  // --- GESTIÓN DE ACCIONES BASE ---
  abrirModalNuevaAccion(): void {
    this.formNombreAccion = '';
    this.formIdentificadorAccion = '';
    this.modalAccionVisible = true;
  }

  cerrarModalAccion(): void {
    this.modalAccionVisible = false;
  }

  guardarAccion(): void {
    if (!this.formNombreAccion.trim() || !this.formIdentificadorAccion.trim()) {
      this.mostrarAlerta('Nombre e Identificador son obligatorios.', 'error');
      return;
    }

    this.adminService.crearAccion(this.formNombreAccion.trim(), this.formIdentificadorAccion.trim()).subscribe({
      next: () => {
        this.mostrarAlerta('Acción base creada correctamente.', 'success');
        this.cerrarModalAccion();
        this.cargarCatalogo();
      },
      error: (err) => this.mostrarAlerta(err.error?.error || 'Error al crear la acción.', 'error')
    });
  }

  cambiarEstadoAccion(a: AccionBase, activo: number): void {
    this.adminService.cambiarEstadoAccion(a.id, activo).subscribe({
      next: () => {
        a.activo = activo;
        this.mostrarAlerta(`Acción ${activo === 1 ? 'activada' : 'desactivada'}.`, 'success');
      },
      error: (err) => {
        const msj = err.error?.error || err.error?.mensaje || err.message || 'Error al cambiar estado.';
        this.mostrarAlerta(msj, 'error');
      }
    });
  }

  eliminarAccion(a: AccionBase): void {
    if (!confirm(`¿Eliminar permanentemente la acción "${a.nombre}"?`)) return;

    this.adminService.eliminarAccion(a.id).subscribe({
      next: () => {
        this.mostrarAlerta('Acción eliminada correctamente.', 'success');
        this.cargarCatalogo();
      },
      error: () => this.mostrarAlerta('Error al eliminar acción.', 'error')
    });
  }

  mostrarAlerta(msj: string, tipo: 'success' | 'error'): void {
    this.alertMsj = msj;
    this.alertTipo = tipo;
    setTimeout(() => (this.alertMsj = null), 4000);
  }
}