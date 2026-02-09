import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FlujoService } from '../../../services/flujo.service';
import { RouterLink } from '@angular/router';
import { HomeBarComponent } from "../../../components/home-bar/home-bar.component";

@Component({
  selector: 'app-logistica',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HomeBarComponent],
  templateUrl: './logistica.component.html',
  styleUrls: ['../logistica/logistica.component.css']
})
export class LogisticaComponent {
  private fb = inject(FormBuilder);
  private flujoService = inject(FlujoService);
  private cd = inject(ChangeDetectorRef);

  mostrarFormulario = false;

  form = this.fb.group({
    codigo_embarque: ['', Validators.required],
    orden_compra_id: ['', Validators.required], // Aquí el usuario pone el ID de la orden (1, 2, etc.)
    contenedor: [''],
    fecha_eta: ['', Validators.required],
    valor_aduana_mxn: [0, Validators.required],
    pago_igi: [0],
    pago_dta: [0],
    gasto_flete_mxn: [0]
  });

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.cd.detectChanges(); 
  }

  guardar() {
    this.flujoService.crearEmbarque(this.form.value).subscribe({
      next: () => {
        alert('Embarque registrado. Impuestos calculados automáticos.');
        this.mostrarFormulario = false;
        this.form.reset();
        this.cd.detectChanges();
      },
      error: (e) => alert('Error: ' + e.message)
    });
  }
}