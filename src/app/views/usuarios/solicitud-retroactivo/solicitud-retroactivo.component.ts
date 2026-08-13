import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { jwtDecode } from 'jwt-decode';

import { TopBarUsuariosComponent } from '../../../components/top-bar-usuarios/top-bar-usuarios.component';
import { environment } from '../../../../environments/environment';
import {
  SolicitudRetroactivoService,
  SolicitudRetroactivo
} from '../../../services/solicitud-retroactivo.service';

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

// GUÍA: etiquetas en español de cada campo, usadas para armar el mensaje de
// "faltan estos campos" (tanto en la validación local como en el rechazo 400
// del backend, que regresa las claves crudas en `campos`).
const ETIQUETAS_CAMPOS: Record<string, string> = {
  id_formulario: 'Tipo de Venta',
  id_marca_bicicleta: 'Marca',
  id_msi: 'Meses Sin Intereses',
  id_cliente: 'Razón Social',
  id_tienda: 'Sucursal / Tienda',
  correo_electronico: 'Correo Electrónico',
  fecha_venta: 'Fecha de Venta',
  modelo_bicicleta: 'Modelo de Bicicleta',
  numero_serie: 'Número de Serie',
  precio_publico: 'Precio'
};

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
  listaRazonSocial: any[] = [];
  listaTiendas: any[] = [];
  cargandoTiendas = false;
  
  ventaForm: FormGroup;
  archivos: { [key: string]: File } = {};
  enviando = false;
  mensajeExito = '';
  mensajeError = '';

  // GUÍA: claves de campos a resaltar en rojo, ya sea porque la validación
  // local los detectó vacíos (incluye los que Angular ignora por estar
  // disabled, como id_msi) o porque el backend los regresó en `campos`.
  camposFaltantes = new Set<string>();

  // GUÍA: "Tus solicitudes" ahora vive en su propia página
  // (solicitud-retroactivo-seguimiento). Este formulario solo necesita saber
  // si hay que precargar una reedición, vía ?editar=<id> en la URL.
  esCliente = false;
  esAdmin = false;
  editandoId: number | null = null;
  cargandoEdicion = false;
  // GUÍA: solo los archivos marcados 'rechazado' en esa solicitud -- el
  // cliente no tiene que resubir los que ya quedaron validos. Ver
  // camposArchivosVisibles más abajo.
  docsRechazadosEnEdicion: string[] = [];

  camposArchivos = [
    { key: 'ticket_compra', label: 'Ticket de compra (debe tener la fecha del mismo mes)', tooltip: 'Debe contener modelo, serie y detalles de la bicicleta', accept: 'image/*,.pdf' },
    { key: 'voucher', label: 'Voucher de pago', tooltip: '', accept: 'image/*,.pdf' },
    { key: 'factura_pdf', label: 'Factura (PDF)', tooltip: '', accept: '.pdf' },
    { key: 'factura_xml', label: 'Factura (XML)', tooltip: '', accept: '.xml' }
  ];

  get camposArchivosVisibles() {
    if (this.editandoId === null) return this.camposArchivos;
    return this.camposArchivos.filter(c => this.docsRechazadosEnEdicion.includes(c.key));
  }

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

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private solicitudService: SolicitudRetroactivoService,
    private route: ActivatedRoute
  ) {
    this.ventaForm = this.fb.group({
      id_formulario: ['', Validators.required],
      id_marca_bicicleta: [{ value: '', disabled: true }],
      id_msi: [{ value: '', disabled: true }, Validators.required],
      id_cliente: ['', Validators.required],
      id_tienda: [{ value: '', disabled: true }, Validators.required],
      correo_electronico: ['', [Validators.required, Validators.email]],
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

  removeArchivo(key: string): void {
    delete this.archivos[key];

    const input = document.querySelector<HTMLInputElement>(`input[type="file"][data-file-key="${key}"]`);
    if (input) {
      input.value = '';
    }
  }

  private formatFechaParaInput(fecha: string | undefined): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }

  private cargarYPrecargarEdicion(id: number): void {
    this.cargandoEdicion = true;
    this.solicitudService.misSolicitudes().subscribe({
      next: (res) => {
        this.cargandoEdicion = false;
        const solicitud = res.find(s => s.id === id);
        if (solicitud) {
          this.iniciarEdicion(solicitud);
        } else {
          this.mensajeError = 'No se encontró la solicitud a reeditar.';
        }
      },
      error: () => {
        this.cargandoEdicion = false;
        this.mensajeError = 'No se pudo cargar la solicitud a reeditar.';
      }
    });
  }

  iniciarEdicion(s: SolicitudRetroactivo): void {
    this.editandoId = s.id;
    this.mensajeExito = '';
    this.mensajeError = '';
    this.archivos = {};
    this.docsRechazadosEnEdicion = Object.entries(s.validacion_docs ?? {})
      .filter(([, estatus]) => estatus === 'rechazado')
      .map(([doc]) => doc);

    this.ventaForm.patchValue({
      id_formulario: s.id_formulario,
      correo_electronico: s.correo_electronico,
      fecha_venta: this.formatFechaParaInput(s.fecha_venta),
      modelo_bicicleta: s.modelo_bicicleta,
      numero_serie: s.numero_serie,
      precio_publico: s.precio_publico
    });

    // El valueChanges de id_formulario habilita id_marca_bicicleta/id_msi y
    // recarga sus catálogos; una vez listos, fijamos los valores guardados.
    setTimeout(() => {
      this.ventaForm.patchValue({
        id_marca_bicicleta: s.id_marca_bicicleta ?? '',
        id_msi: s.id_msi
      });
    }, 400);

    document.querySelector('.form-container')?.scrollIntoView({ behavior: 'smooth' });
  }

  cancelarEdicion(): void {
    this.editandoId = null;
    this.docsRechazadosEnEdicion = [];
    this.ventaForm.reset();
    this.archivos = {};
  }

  // Bordea en rojo el form-group del campo, ya sea por invalidez local o
  // porque el backend lo marcó como faltante.
  esCampoInvalido(campo: string): boolean {
    const control = this.ventaForm.get(campo);
    return this.camposFaltantes.has(campo) || !!(control?.invalid && control?.touched);
  }

  // GUÍA: revisa a mano los campos requeridos que pueden estar disabled
  // (id_msi siempre, id_marca_bicicleta solo si id_formulario == 1). Angular
  // excluye los controles disabled de ventaForm.invalid, así que sin este
  // chequeo el formulario "pasa" localmente aunque vayan vacíos al backend.
  private camposCondicionalesFaltantes(): string[] {
    const valores = this.ventaForm.getRawValue();
    const faltantes: string[] = [];

    if (!valores.id_msi) {
      faltantes.push('id_msi');
    }
    if (this.listaTiendas.length > 0 && !valores.id_tienda) {
      faltantes.push('id_tienda');
    }
    if (valores.id_formulario == 1 && !valores.id_marca_bicicleta) {
      faltantes.push('id_marca_bicicleta');
    }
    return faltantes;
  }

  onSubmit(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.camposFaltantes.clear();

    const condicionalesFaltantes = this.camposCondicionalesFaltantes();

    if (this.ventaForm.invalid || condicionalesFaltantes.length > 0) {
      this.ventaForm.markAllAsTouched();
      condicionalesFaltantes.forEach(campo => this.camposFaltantes.add(campo));

      Object.keys(this.ventaForm.controls).forEach(campo => {
        if (this.ventaForm.get(campo)?.invalid) {
          this.camposFaltantes.add(campo);
        }
      });

      const etiquetas = [...this.camposFaltantes].map(c => ETIQUETAS_CAMPOS[c] || c);
      this.mensajeError = `Faltan estos campos: ${etiquetas.join(', ')}.`;
      return;
    }

    // Se filtran los archivos faltantes excluyendo los opcionales (XML)
    const archivosFaltantes = this.camposArchivosVisibles.filter(item => 
      !this.archivos[item.key] && item.key !== 'factura_xml'
    );
    if (archivosFaltantes.length > 0) {
      this.mensajeError = `Falta adjuntar los siguientes archivos: ${archivosFaltantes.map(f => f.label).join(', ')}`;
      return;
    }

    this.enviando = true;

    const formData = new FormData();
    const datosFormulario = this.ventaForm.getRawValue();

    const clienteSel = this.listaRazonSocial.find(c => c.id == datosFormulario.id_cliente);
    const tiendaSel = this.listaTiendas.find(t => t.id == datosFormulario.id_tienda);

    if (datosFormulario.precio_publico) {
      datosFormulario.precio_publico = datosFormulario.precio_publico.toString().replace(/,/g, '');
    }

    Object.keys(datosFormulario).forEach(key => {
      formData.append(key, datosFormulario[key] ?? '');
    });

    if (clienteSel) {
      formData.append('nombre_completo', clienteSel.nombre_cliente);
    }
    if (tiendaSel) {
      formData.append('nombre_sucursal', tiendaSel.nombre);
    }

    Object.keys(this.archivos).forEach(key => {
      formData.append(key, this.archivos[key], this.archivos[key].name);
    });

    const token = localStorage.getItem('token');
    if (!token) return;

    const manejarExito = (mensaje: string) => {
      this.enviando = false;
      this.mensajeExito = mensaje;
      this.editandoId = null;
      this.docsRechazadosEnEdicion = [];

      this.ventaForm.reset();
      this.archivos = {};

      const inputsArchivos = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
      inputsArchivos.forEach(input => input.value = '');

      this.ventaForm.get('id_marca_bicicleta')?.disable();
      this.ventaForm.get('id_msi')?.disable();
      this.ventaForm.get('id_tienda')?.disable();
    };

    const manejarError = (err: any) => {
      this.enviando = false;

      const camposBackend: string[] = err.error?.campos ?? [];
      if (camposBackend.length > 0) {
        camposBackend.forEach(campo => this.camposFaltantes.add(campo));
        const etiquetas = camposBackend.map(c => ETIQUETAS_CAMPOS[c] || c);
        this.mensajeError = `Faltan estos campos: ${etiquetas.join(', ')}.`;
      } else {
        this.mensajeError = err.error?.error || 'Ocurrió un error al enviar la información.';
      }
    };

    if (this.editandoId !== null) {
      this.solicitudService.actualizarVenta(this.editandoId, formData).subscribe({
        next: () => manejarExito('¡Solicitud actualizada y enviada de nuevo a revisión!'),
        error: manejarError
      });
      return;
    }

    formData.set('id_usuario', JSON.parse(atob(token.split('.')[1])).id);

    this.http.post(`${environment.apiUrl}/api/solicitud-retroactivo/registrar/venta`, formData)
      .subscribe({
        next: () => manejarExito('¡Venta y archivos cargados con éxito!'),
        error: manejarError
      });
  }

  async ngOnInit() {
    let clienteIdUsuario: number | null = null;
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.esCliente = decoded.rol === 2;
        this.esAdmin = decoded.rol === 1;
        if (decoded.cliente_id) {
          clienteIdUsuario = Number(decoded.cliente_id);
        }
      } catch { /* token inválido */ }
    }
    const idEditar = Number(this.route.snapshot.queryParamMap.get('editar'));
    if (this.esCliente && idEditar) {
      this.cargarYPrecargarEdicion(idEditar);
    }

    this.ventaForm.get('id_cliente')?.valueChanges.subscribe((clienteId) => {
      const controlTienda = this.ventaForm.get('id_tienda');
      controlTienda?.setValue('');
      controlTienda?.markAsUntouched();
      controlTienda?.markAsPristine();
      this.camposFaltantes.delete('id_tienda');
      if (clienteId) {
        this.cargarTiendas(Number(clienteId));
      } else {
        this.listaTiendas = [];
        controlTienda?.disable();
      }
    });

    try {
        this.listaFormulario = await this.buscarTipoFormulario();

        this.solicitudService.buscarRazonesSociales().subscribe({
          next: (razones) => {
            this.listaRazonSocial = razones;
            if (clienteIdUsuario && razones.some(r => r.id === clienteIdUsuario)) {
              this.ventaForm.patchValue({ id_cliente: clienteIdUsuario });
            }
          },
          error: (err) => console.error("Error al obtener Razones Sociales:", err)
        });

        this.ventaForm.get('id_formulario')?.valueChanges.subscribe(async (valor) => {
          if (!valor) {
            this.listaMarca = [];
            this.listaMsi = [];
            return;
          }

          const controlMarca = this.ventaForm.get('id_marca_bicicleta');
          const controlMsi = this.ventaForm.get('id_msi');

          if (valor == 1) {
            controlMarca?.setValidators([Validators.required]);
            try {
              this.listaMarca = await this.buscarMarca();
              this.listaMarca.length ? controlMarca?.enable() : controlMarca?.disable();
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

  cargarTiendas(clienteId: number): void {
    const controlTienda = this.ventaForm.get('id_tienda');
    this.cargandoTiendas = true;
    this.solicitudService.buscarTiendas(clienteId).subscribe({
      next: (tiendas) => {
        this.cargandoTiendas = false;
        this.listaTiendas = tiendas;
        controlTienda?.enable();
      },
      error: (err) => {
        console.error("Error al cargar tiendas:", err);
        this.cargandoTiendas = false;
        this.listaTiendas = [];
        controlTienda?.enable();
      }
    });
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