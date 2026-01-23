import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FlujoService } from '../../../services/flujo.service';
import { AlertaService } from '../../../services/alerta.service';
import { RouterLink } from '@angular/router';
import { HomeBarComponent } from "../../../components/home-bar/home-bar.component";
import { ConfirmService } from '../../../services/confirm.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ordenes-compra',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HomeBarComponent],
  templateUrl: './ordenes-compra.component.html',
  styleUrls: ['./ordenes-compra.component.css']
})
export class OrdenesCompraComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private flujoService = inject(FlujoService);
  private alertaService = inject(AlertaService);
  private cd = inject(ChangeDetectorRef);
  private confirmService = inject(ConfirmService);
  mostrarFormulario = false;
  listaOrdenes: any[] = [];
  ordenSeleccionadaId: number | null = null;

  mensajeAlerta: string | null = null;
  tipoAlerta: 'exito' | 'error' = 'exito';
  private alertaSub: Subscription | null = null; // Guardamos la suscripción
  private timeoutId: any;

  form = this.fb.group({
    codigo_po: ['', Validators.required],
    proveedor: ['Scott', Validators.required],
    fecha_po: ['', Validators.required],
    moneda: ['MXN', Validators.required],
    importe_original: ['', Validators.required],
    fecha_vencimiento: ['', Validators.required],
    estatus: ['PRODUCCION']
  });

  ngOnInit(): void {
    this.cargarOrdenes();

    this.alertaSub = this.alertaService.alerta$.subscribe(data => {
      this.mensajeAlerta = data.mensaje;
      this.tipoAlerta = data.tipo;
      this.cd.detectChanges();

      if (this.timeoutId) clearTimeout(this.timeoutId);
      this.timeoutId = setTimeout(() => {
        this.mensajeAlerta = null;
        this.cd.detectChanges();
      }, 4000);
    });
  }

  ngOnDestroy(): void {
    if (this.alertaSub) {
      this.alertaSub.unsubscribe();
    }
  }

  cargarOrdenes() {
    this.flujoService.obtenerOrdenes().subscribe({
      next: (data) => {
        this.listaOrdenes = data;
        this.cd.detectChanges();
      },
      error: (e) => console.error(e)
    });
  }

  toggleFormulario() {
    if (this.mostrarFormulario && this.ordenSeleccionadaId) {
      this.limpiarFormulario();
    }
    this.mostrarFormulario = !this.mostrarFormulario;
    this.cd.detectChanges();
  }

  editarOrden(orden: any) {
    this.ordenSeleccionadaId = orden.id_orden;
    this.mostrarFormulario = true;
    const importeConComas = this.agregarComas(orden.importe_original);

    this.form.patchValue({
      codigo_po: orden.codigo_po,
      proveedor: orden.proveedor,
      fecha_po: orden.fecha_po,
      moneda: orden.moneda,
      importe_original: importeConComas,
      fecha_vencimiento: orden.fecha_vencimiento,
      estatus: orden.estatus
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  eliminarOrden(id: number) {
    this.confirmService.confirmar('¿Estás seguro de eliminar esta orden permanentemente?')
      .then((confirmado) => {
        if (confirmado) {
          this.flujoService.eliminarOrden(id).subscribe({
            next: () => {
              this.alertaService.mostrarExito('Orden eliminada correctamente');
              this.cargarOrdenes();
            },
            error: (e) => this.alertaService.mostrarError('Error al eliminar: ' + e.message)
          });
        }
      });
  }

guardar() {
    if (this.form.invalid) {
      this.alertaService.mostrarError('Por favor completa todos los campos requeridos');
      return;
    }
    
    const datosParaEnviar: any = { ...this.form.value };
    
    // Limpiar comas del dinero
    if (datosParaEnviar.importe_original) {
      datosParaEnviar.importe_original = parseFloat(
        datosParaEnviar.importe_original.toString().replace(/,/g, '')
      );
    }

    if (this.ordenSeleccionadaId) {
      // EDITAR
      this.flujoService.actualizarOrden(this.ordenSeleccionadaId, datosParaEnviar).subscribe({
        next: () => {
          this.alertaService.mostrarExito('Orden Actualizada Correctamente');
          this.limpiarFormulario();
          this.cargarOrdenes();
        },
        error: (e) => this.alertaService.mostrarError('Error al actualizar: ' + e.message)
      });
    } else {
      // CREAR
      this.flujoService.crearOrden(datosParaEnviar).subscribe({
        next: () => {
          this.alertaService.mostrarExito('Orden Creada Correctamente');
          this.limpiarFormulario();
          this.cargarOrdenes();
        },
        error: (e) => this.alertaService.mostrarError('Error al crear: ' + e.message)
      });
    }
  }

  limpiarFormulario() {
    this.ordenSeleccionadaId = null;
    this.mostrarFormulario = false;
    this.form.reset({ moneda: 'MXN', proveedor: 'Scott', estatus: 'PRODUCCION' });
    this.cd.detectChanges();
  }

  formatearMoneda(event: any) {
    let valor = event.target.value;
    valor = valor.replace(/[^0-9.]/g, '');
    const partes = valor.split('.');
    partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const valorFinal = partes.join('.');
    this.form.get('importe_original')?.setValue(valorFinal, { emitEvent: false });
  }

  agregarComas(numero: number | string): string {
    if (!numero) return '';
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}