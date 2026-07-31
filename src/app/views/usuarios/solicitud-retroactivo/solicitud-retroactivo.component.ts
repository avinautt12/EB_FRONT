import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { TopBarUsuariosComponent } from '../../../components/top-bar-usuarios/top-bar-usuarios.component';
import { environment } from '../../../../environments/environment';

interface Marca {
  id: number;
  nombre: string;
}

interface Msi {
  id: number;
  plazo_meses: number;
}

interface Formulario {
  id: number;
  nombre: string;
}

const marcaVacia = (): Marca => ({
  id: -1,
  nombre: ""
});

const msiVacio = (): Msi => ({
  id: -1,
  plazo_meses: -1
});

const tipoFormularioVacio = (): Formulario => ({
  id: -1,
  nombre: ""
});

@Component({
  selector: 'app-solicitud-retroactivo',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TopBarUsuariosComponent],
  templateUrl: './solicitud-retroactivo.component.html',
  styleUrl: './solicitud-retroactivo.component.css'
})
export class SolicitudRetroactivoComponent implements OnInit {
  listaMarca: Marca[] = [marcaVacia()];
  listaMsi: Msi[] = [msiVacio()];
  listaFormulario: Formulario[] = [tipoFormularioVacio()];
  
  ventaForm: FormGroup;
  archivos: { [key: string]: File } = {};
  enviando = false;
  mensajeExito = '';
  mensajeError = '';
  
  camposArchivos = [
    { key: 'ticket_compra', label: 'Ticket de compra', accept: 'image/*,.pdf' },
    { key: 'voucher', label: 'Voucher de pago', accept: 'image/*,.pdf' },
    { key: 'factura_pdf', label: 'Factura (PDF)', accept: '.pdf' },
    { key: 'factura_xml', label: 'Factura (XML)', accept: '.xml' }
  ];

  validarCantidad(e: Event): void {
    const input = e.target as HTMLInputElement;
    const cursor = input.selectionStart || 0;
    const valorOriginal = input.value;

    const limpio = valorOriginal.replace(/[^0-9.]/g, '')
                                .replace(/(\..*)\./g, '$1')
                                .replace(/(\.\d{2})\d+/, '$1');

    const [entero, decimal] = limpio.split('.');
    const formateado = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + 
                      (decimal !== undefined ? `.${decimal}` : '');

    const nuevaPosicion = cursor + (formateado.length - valorOriginal.length);
    
    input.value = formateado;
    input.setSelectionRange(nuevaPosicion, nuevaPosicion);
    this.ventaForm.get('precio_publico')?.setValue(formateado, { emitEvent: false });
  }

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.ventaForm = this.fb.group({
      id_formulario: ['', Validators.required],
      id_marca_bicicleta: [{ value: '', disabled: true }],
      id_msi: [{ value: '', disabled: true }, Validators.required],
      nombre_sucursal: ['', Validators.required],
      correo_electronico: ['', [Validators.required, Validators.email]],
      nombre_completo: ['', Validators.required],
      fecha_venta: ['', Validators.required],
      modelo_bicicleta: ['', Validators.required],
      numero_serie: ['', Validators.required],
      precio_publico: ['', Validators.required]
    });
  }

  onFileSelect(event: Event, key: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivos[key] = input.files[0];
    }
  }

  onSubmit(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.ventaForm.invalid) {
      this.ventaForm.markAllAsTouched();
      this.mensajeError = 'Por favor completa todos los campos de texto requeridos.';
      return;
    }

    const archivosFaltantes = this.camposArchivos.filter(item => !this.archivos[item.key]);
    if (archivosFaltantes.length > 0) {
      this.mensajeError = `Falta adjuntar los siguientes archivos: ${archivosFaltantes.map(f => f.label).join(', ')}`;
      return;
    }

    this.enviando = true;

    const formData = new FormData();
    const datosFormulario = this.ventaForm.getRawValue();

    if (datosFormulario.precio_publico) {
      datosFormulario.precio_publico = datosFormulario.precio_publico.toString().replace(/,/g, '');
    }

    Object.keys(datosFormulario).forEach(key => {
      formData.append(key, datosFormulario[key] ?? '');
    });

    Object.keys(this.archivos).forEach(key => {
      formData.append(key, this.archivos[key], this.archivos[key].name);
    });

    const token = localStorage.getItem('token');

    if (token){
      // GUÍA: usuarioGuard permite entrar aquí también con rol 1 (admin), desde
      // el botón del monitor "Retroactivos". Si quien llena el formulario es un
      // admin, este id sale de SU token, no del cliente real -> la venta queda
      // registrada a nombre del admin. Ver usuario.guard.ts (rutasUsuarioYAdmin).
      formData.set('id_usuario', JSON.parse(atob(token.split('.')[1])).id);

      this.http.post(`${environment.apiUrl}/api/solicitud-retroactivo/registrar/venta`, formData)
        .subscribe({
          next: (res: any) => {
            this.enviando = false;
            this.mensajeExito = '¡Venta y archivos cargados con éxito!';
            
            // Reset del formulario
            this.ventaForm.reset();
            
            // Vaciar archivos locales
            this.archivos = {};
  
            // Limpiar visualmente los inputs tipo file en el DOM
            const inputsArchivos = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
            inputsArchivos.forEach(input => input.value = '');
  
            // Deshabilitar controles dependientes tras el reseteo
            this.ventaForm.get('id_marca_bicicleta')?.disable();
            this.ventaForm.get('id_msi')?.disable();
          },
          error: (err) => {
            this.enviando = false;
            this.mensajeError = err.error?.error || 'Ocurrió un error al enviar la información.';
          }
        });
    }

  }

  async ngOnInit() {
    try {
        this.listaFormulario = await this.buscarTipoFormulario();

        this.ventaForm.get('id_formulario')?.valueChanges.subscribe(async (valor) => {
          // Prevención de error 404 cuando el formulario se resetea
          if (!valor) {
            this.listaMarca = [];
            this.listaMsi = [];
            return;
          }

          const controlMarca = this.ventaForm.get('id_marca_bicicleta');
          // const controlUsuario = this.ventaForm.get('id_usuario');
          const controlMsi = this.ventaForm.get('id_msi');

          if (valor == 1) {
            controlMarca?.setValidators([Validators.required]);
            try {
              this.listaMarca = await this.buscarMarca();
              this.listaMarca.length ? controlMarca?.enable() : controlMarca?.disable();

              console.log(this.listaMarca)
            } catch (err) {
              console.error("Error al obtener marcas:", err);
              controlMarca?.disable();
            }
          } else {
            controlMarca?.clearValidators();
            controlMarca?.setValue('');
            controlMarca?.disable();
            this.listaMarca = [];
          }

          controlMarca?.updateValueAndValidity();
          
          try {

            this.listaMsi = await this.buscarMsi();
            this.listaMsi.length ? controlMsi?.enable() : controlMsi?.disable();
          } catch (err) {
            console.error("Error al obtener catálogos:", err);
            controlMsi?.disable();
          }
      });
    } catch (error) {
      console.error("Error al cargar la información inicial:", error);
    }
  }

  async buscarTipoFormulario(): Promise<Formulario[]> {
    const res = await fetch(`${environment.apiUrl}/api/solicitud-retroactivo/formulario`);
    if (!res.ok) throw new Error("Error API");
    return res.json();
  }

  async buscarMarca(): Promise<Marca[]> {
    const res = await fetch(`${environment.apiUrl}/api/solicitud-retroactivo/marca`);
    if (!res.ok) throw new Error("Error API");
    return res.json();
  }

  async buscarMsi(): Promise<Msi[]> {
    const res = await fetch(`${environment.apiUrl}/api/solicitud-retroactivo/msi`);
    if (!res.ok) throw new Error("Error API");
    return res.json();
  }
}