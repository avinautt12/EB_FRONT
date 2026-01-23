import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FlujoService } from '../../../services/flujo.service';
import { RouterLink } from '@angular/router';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HomeBarComponent],
  templateUrl: './ingresos.component.html',
  styleUrls: ['../tablero/tablero.component.css'] // Reusamos estilos para ir rápido
})
export class IngresosComponent {
  private fb = inject(FormBuilder);
  private flujoService = inject(FlujoService);
  private cd = inject(ChangeDetectorRef);

  mostrarFormulario = false;

  // Formulario para capturar la proyección de cobranza
  form = this.fb.group({
    cliente: ['', Validators.required],
    folio_factura: ['', Validators.required],
    monto_cobro: [0, [Validators.required, Validators.min(1)]],
    fecha_promesa_pago: ['', Validators.required],
    cuenta_destino: ['Santander', Validators.required],
    probabilidad: ['ALTA', Validators.required]
  });

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.cd.detectChanges();
  }

  guardar() {
    if (this.form.invalid) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    this.flujoService.crearIngreso(this.form.value).subscribe({
      next: () => {
        alert('Proyección de Ingreso Guardada');
        this.mostrarFormulario = false;
        this.form.reset({ 
          cuenta_destino: 'Santander', 
          probabilidad: 'ALTA' 
        });
        this.cd.detectChanges();
      },
      error: (e) => alert('Error al guardar: ' + e.message)
    });
  }
}