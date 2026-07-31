import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { TopBarUsuariosComponent } from '../../../components/top-bar-usuarios/top-bar-usuarios.component';
import { environment } from '../../../../environments/environment';

interface Cliente {
  id: number;
  nombre: string;
}

interface Marca {
  id: number;
  nombre_marca: string;
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
  nombre_marca: ""
});

const clienteVacio = (): Cliente => ({
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
  imports: [CommonModule, ReactiveFormsModule, TopBarUsuariosComponent],
  templateUrl: './solicitud-retroactivo.component.html',
  styleUrl: './solicitud-retroactivo.component.css'
})
export class SolicitudRetroactivoComponent implements OnInit {
  listaCliente: Cliente[] = [clienteVacio()];
  listaMarca: Marca[] = [marcaVacia()];
  listaMsi: Msi[] = [msiVacio()];
  listaFormulario: Formulario[] = [tipoFormularioVacio()];

  ventaForm: FormGroup;
  archivos: { [key: string]: File } = {};
  enviando = false;
  mensajeExito = '';
  mensajeError = '';

  // Lista de identificadores de archivos requeridos
  camposArchivos = [
    { key: 'ticket_compra', label: 'Ticket de compra', accept: 'image/*,.pdf' },
    { key: 'voucher', label: 'Voucher de pago', accept: 'image/*,.pdf' },
    { key: 'factura_pdf', label: 'Factura (PDF)', accept: '.pdf' },
    { key: 'factura_xml', label: 'Factura (XML)', accept: '.xml' }
  ];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    // Inicializamos con disabled: true los controles dependientes
    this.ventaForm = this.fb.group({
      formulario: ['', Validators.required],
      razon_social: [{ value: '', disabled: true }, Validators.required],
      marca_bicicleta: [{ value: '', disabled: true }, Validators.required],
      msi: [{ value: '', disabled: true }, Validators.required],
      nombre_sucursal: ['', Validators.required],
      correo_electronico: ['', [Validators.required, Validators.email]],
      nombre_completo: ['', Validators.required],
      fecha_venta: ['', Validators.required],
      modelo_bicicleta: ['', Validators.required],
      numero_serie: ['', Validators.required]
    });
  }

  // Captura los archivos seleccionados en los <input type="file">
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

    // Validar que se hayan cargado los 4 archivos
    const archivosFaltantes = this.camposArchivos.filter(item => !this.archivos[item.key]);
    if (archivosFaltantes.length > 0) {
      this.mensajeError = `Falta adjuntar los siguientes archivos: ${archivosFaltantes.map(f => f.label).join(', ')}`;
      return;
    }

    this.enviando = true;

    // Construir FormData para enviar texto + archivos
    const formData = new FormData();

    // 1. Agregar valores de texto (usamos getRawValue() para incluir deshabilitados si fuera necesario)
    const datosFormulario = this.ventaForm.getRawValue();
    Object.keys(datosFormulario).forEach(key => {
      formData.append(key, datosFormulario[key]);
    });

    // 2. Agregar archivos
    Object.keys(this.archivos).forEach(key => {
      formData.append(key, this.archivos[key], this.archivos[key].name);
    });

    // 3. Enviar HTTP POST a la API Flask
    this.http.post(`${environment.apiUrl}/api/registrar/venta`, formData)
      .subscribe({
        next: (res: any) => {
          this.enviando = false;
          this.mensajeExito = '¡Venta y archivos cargados con éxito!';
          this.ventaForm.reset();
          this.archivos = {};

          // Volver a bloquear tras reiniciar
          this.ventaForm.get('razon_social')?.disable();
          this.ventaForm.get('marca_bicicleta')?.disable();
          this.ventaForm.get('msi')?.disable();
        },
        error: (err) => {
          this.enviando = false;
          this.mensajeError = err.error?.error || 'Ocurrió un error al enviar la información.';
        }
      });
  }

  async ngOnInit() {
    try {
      // 1. Cargar catálogo inicial de tipos de formulario
      this.listaFormulario = await this.buscarTipoFormulario();

      // 2. Escuchar cambios en el selector 'formulario'
      this.ventaForm.get('formulario')?.valueChanges.subscribe(async (valor) => {
        const controlMarca = this.ventaForm.get('marca_bicicleta');
        const controlCliente = this.ventaForm.get('razon_social');
        const controlMsi = this.ventaForm.get('msi');

        if (valor == 1) {
          // Habilitar validación requerida para Marca
          controlMarca?.setValidators([Validators.required]);

          try {
            this.listaMarca = await this.buscarMarca();
            this.listaMarca.length ? controlMarca?.enable() : controlMarca?.disable();
          } catch (err) {
            console.error("Error al obtener marcas:", err);
            controlMarca?.disable();
          }

        } else {
          // Si no es el tipo 1, limpiar validación, valor y catálogo
          controlMarca?.clearValidators();
          controlMarca?.setValue('');
          controlMarca?.disable();
          this.listaMarca = [];
        }
        
        // Lectura del cliente -- Habilita o deshabilita según si hay elementos
        try {
          this.listaCliente = await this.buscarCliente(valor);
          this.listaCliente.length ? controlCliente?.enable() : controlCliente?.disable();
          
          this.listaMsi = await this.buscarMsi();
          this.listaMsi.length ? controlMsi?.enable() : controlMsi?.disable();

        } catch (err) {
          console.error("Error al obtener clientes:", err);
          controlCliente?.disable();
          controlMsi?.disable();
        }

        // Re-evaluar el estado del control en el formulario
        controlMarca?.updateValueAndValidity();

      });

    } catch (error) {
      console.error("Error al cargar la información inicial:", error);
    }
  }

  async buscarCliente(clienteId: number): Promise<Cliente[]> {
    const res = await fetch(`${environment.apiUrl}/api/solicitud-retroactivo/cliente/${clienteId}`);
    if (!res.ok) {
      throw new Error("Error API");
    }  
    return res.json();
  }

  async buscarTipoFormulario(): Promise<Formulario[]> {
    const res = await fetch(`${environment.apiUrl}/api/solicitud-retroactivo/formulario`);
    if (!res.ok) {
      throw new Error("Error API");
    }  
    return res.json();
  }

  async buscarMarca(): Promise<Marca[]> {
    const res = await fetch(`${environment.apiUrl}/api/solicitud-retroactivo/marca`);
    if (!res.ok) {
      throw new Error("Error API");
    }  
    return res.json();
  }

  async buscarMsi(): Promise<Msi[]> {
    const res = await fetch(`${environment.apiUrl}/api/solicitud-retroactivo/msi`);
    if (!res.ok) {
      throw new Error("Error API");
    }  
    return res.json();
  }
}