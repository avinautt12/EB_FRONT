import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FlujoService } from '../../../services/flujo.service';
import { RouterLink } from '@angular/router';
import { TopBarComponent } from "../../../components/top-bar/top-bar.component";
import { HomeBarComponent } from "../../../components/home-bar/home-bar.component";

@Component({
  selector: 'app-gastos-operativos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HomeBarComponent],
  templateUrl: './gastos-operativos.component.html',
  styleUrls: ['../tablero/tablero.component.css'] // Reusamos estilos
})
export class GastosOperativosComponent {
  private fb = inject(FormBuilder);
  private flujoService = inject(FlujoService);
  private cd = inject(ChangeDetectorRef);

  mostrarFormulario = false;

  form = this.fb.group({
    codigo_interno: [''], 
    concepto: ['', Validators.required],
    categoria: ['ADMINISTRATIVO', Validators.required],
    proveedor_fijo: [''],
    dia_pago_std: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    monto_base: [0, [Validators.required, Validators.min(1)]],
    frecuencia: ['MENSUAL']
  });

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.cd.detectChanges(); 
  }

  guardar() {
    if (this.form.invalid) {
      alert('Revisa los campos obligatorios');
      return;
    }

    this.flujoService.crearGasto(this.form.value).subscribe({
      next: () => {
        alert('Gasto Fijo Registrado. Se proyectará automáticamente cada mes.');
        this.mostrarFormulario = false;
        this.form.reset({
          categoria: 'ADMINISTRATIVO',
          dia_pago_std: 1,
          frecuencia: 'MENSUAL'
        });
        this.cd.detectChanges();
      },
      error: (e) => alert('Error: ' + e.message)
    });
  }
}