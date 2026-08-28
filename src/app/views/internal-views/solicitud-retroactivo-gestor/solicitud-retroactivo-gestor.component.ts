import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  SolicitudRetroactivoService,
  SolicitudRetroactivo,
  EstatusDocumento,
  ItemHistorial
} from '../../../services/solicitud-retroactivo.service';
import { AuthService } from '../../../services/auth.service';

interface DocumentoMostrar {
  key: string;
  label: string;
  url: string | null;
  estatus: EstatusDocumento;
}

// GUÍA: layout maestro-detalle inspirado en GarantiasTicketsComponent
// (views/internal-views/garantias/garantias-tickets) -- panel de lista fijo
// a la izquierda + panel de detalle scrollable a la derecha, con bloques
// "dp-section" y la misma paleta de colores (--surface2/--border2/--orange).
@Component({
  selector: 'app-solicitud-retroactivo-gestor',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './solicitud-retroactivo-gestor.component.html',
  styleUrl: './solicitud-retroactivo-gestor.component.css'
})
export class SolicitudRetroactivoGestorComponent implements OnInit {
  cargando = true;
  error = '';
  solicitudes: SolicitudRetroactivo[] = [];

  seleccionada: SolicitudRetroactivo | null = null;
  busqueda = '';
  filtroEstatus: 'todos' | 'pendiente' | 'validado' | 'rechazado' = 'todos';
  filtroCampana = '';
  ordenFecha: 'asc' | 'desc' = 'desc';

  // GUÍA: la Nota de Crédito es un flujo de 2 roles separados del estatus
  // general del ticket -- BCYP captura el texto ('sin_capturar' ->
  // 'pendiente'), Auditoría la valida ('pendiente' -> 'validada'). Este
  // filtro deja que cada quien encuentre rápido lo que le toca hacer sin
  // tener que abrir cada solicitud a revisar.
  filtroNotaCredito: 'todos' | 'sin_capturar' | 'pendiente' | 'validada' = 'todos';

  private readonly colorPorNotaCredito: Record<string, string> = {
    sin_capturar: '#7a7168',
    pendiente: '#f59e0b',
    validada: '#4caf50'
  };

  private readonly colorPorEstatus: Record<string, string> = {
    pendiente: '#f59e0b',
    validado: '#4caf50',
    rechazado: '#e53935'
  };

  // GUÍA: clave = nombre del documento -- solo hay una solicitud
  // seleccionada a la vez, no hace falta prefijar con el id.
  procesandoDoc = new Set<string>();

  editandoPrecio = false;
  precioEditado = '';
  guardandoPrecio = false;
  errorPrecio = '';

  editandoNotaCredito = false;
  notaCreditoEditada = '';
  guardandoNotaCredito = false;
  errorNotaCredito = '';
  usuarioActual = 'Usuario';

  // GUÍA: BCYP captura la nota de crédito (arriba), pero solo Auditoría
  // puede validarla -- por eso requiere un código numérico aparte, no basta
  // con estar logueado como admin. Mismo patrón visual que el diálogo OTP
  // de proyecciones-tab, pero self-contained (no usa el sistema de OTP por
  // usuario/expiración de ese módulo, que es para otro caso de uso).
  codigoAuditoriaDialog = { abierto: false, codigo: '', error: '', verificando: false };

  etiquetasDoc: Record<string, string> = {
    ticket_compra: 'Ticket de compra',
    voucher: 'Voucher de pago',
    factura_pdf: 'Factura (PDF)',
    factura_xml: 'Factura (XML)'
  };

  constructor(
    private service: SolicitudRetroactivoService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  // GUÍA: antes el ícono/color del timeline dependía solo de item.tipo, y
  // 'validacion' cubre validar, rechazar Y deshacer -- las 3 acciones salían
  // idénticas (mismo check verde), imposible distinguir a simple vista.
  // Ahora también mira la descripción para diferenciar el resultado real.
  iconoHistorial(item: ItemHistorial): { icono: string; clase: string } {
    const desc = (item.descripcion || '').toLowerCase();

    if (item.tipo === 'creacion') return { icono: 'fa-plus', clase: 'tl-naranja' };
    if (item.tipo === 'reenvio') return { icono: 'fa-redo', clase: 'tl-ambar' };
    if (item.tipo === 'precio') return { icono: 'fa-dollar-sign', clase: 'tl-azul' };

    if (item.tipo === 'nota_credito') {
      if (desc.includes('validada')) return { icono: 'fa-shield-halved', clase: 'tl-verde' };
      return { icono: 'fa-file-invoice-dollar', clase: 'tl-morado' };
    }

    if (item.tipo === 'validacion') {
      if (desc.includes('deshecho')) return { icono: 'fa-rotate-left', clase: 'tl-gris' };
      if (desc.includes('rechazado')) return { icono: 'fa-times', clase: 'tl-rojo' };
      return { icono: 'fa-check', clase: 'tl-verde' };
    }

    return { icono: 'fa-circle', clase: 'tl-gris' };
  }

  // GUÍA: se guarda en orden cronológico (cada mutación hace .append en el
  // backend), pero se muestra más reciente arriba -- es lo que se espera
  // ver primero al abrir el historial de un ticket. No se toca el arreglo
  // original ni cómo se guarda, solo el orden de despliegue.
  historialOrdenado(historial: ItemHistorial[] | undefined): ItemHistorial[] {
    return historial ? [...historial].reverse() : [];
  }

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUserName() || 'Usuario';
    // GUÍA: llega por ?estatus=pendiente|validado|rechazado desde las KPI del
    // dashboard (mismo patrón que kpi-clickable en garantias.component: la
    // tarjeta navega a la lista ya filtrada) y/o ?id=<id> para abrir
    // directo el detalle de una solicitud (desde el modal de "Por Cliente").
    const estatus = this.route.snapshot.queryParamMap.get('estatus');
    if (estatus === 'pendiente' || estatus === 'validado' || estatus === 'rechazado') {
      this.filtroEstatus = estatus;
    }
    this.cargar();
  }

  private normalizarTextoNotaCredito(texto: string): string {
    if (!texto) return '';
    return texto.replace(/'([^']+)'/g, '$1');
  }

  private normalizarHistorial(historial: ItemHistorial[] = []): ItemHistorial[] {
    return historial.map(item => ({
      ...item,
      descripcion: this.normalizarTextoNotaCredito(item.descripcion)
    }));
  }

  cargar(): void {
    this.cargando = true;
    this.service.listar().subscribe({
      next: (res) => {
        this.solicitudes = res.map(s => ({
          ...s,
          historial: this.normalizarHistorial(s.historial)
        }));
        this.cargando = false;

        const idParam = this.route.snapshot.queryParamMap.get('id');
        if (idParam) {
          const solicitud = this.solicitudes.find(s => s.id === Number(idParam));
          if (solicitud) this.seleccionar(solicitud);
        }
      },
      error: () => {
        this.error = 'No se pudieron cargar las solicitudes.';
        this.cargando = false;
      }
    });
  }

  get campanasDisponibles(): string[] {
    const set = new Set(this.solicitudes.map(s => s.nombre_formulario).filter(Boolean));
    return Array.from(set).sort();
  }

  get solicitudesFiltradas(): SolicitudRetroactivo[] {
    const termino = this.busqueda.trim().toLowerCase();
    const resultado = this.solicitudes.filter(s => {
      if (this.filtroEstatus !== 'todos' && s.estatus !== this.filtroEstatus) return false;
      if (this.filtroCampana && s.nombre_formulario !== this.filtroCampana) return false;
      if (this.filtroNotaCredito !== 'todos' && this.estadoNotaCredito(s) !== this.filtroNotaCredito) return false;
      if (!termino) return true;
      return s.nombre_completo.toLowerCase().includes(termino)
        || s.numero_serie.toLowerCase().includes(termino)
        || s.correo_electronico.toLowerCase().includes(termino);
    });

    const signo = this.ordenFecha === 'asc' ? 1 : -1;
    return [...resultado].sort((a, b) => (new Date(a.fecha_venta).getTime() - new Date(b.fecha_venta).getTime()) * signo);
  }

  toggleOrdenFecha(): void {
    this.ordenFecha = this.ordenFecha === 'desc' ? 'asc' : 'desc';
  }

  estadoNotaCredito(s: SolicitudRetroactivo): 'sin_capturar' | 'pendiente' | 'validada' {
    if (!s.nota_credito) return 'sin_capturar';
    return s.nota_credito_estatus === 'validada' ? 'validada' : 'pendiente';
  }

  /** Conteo GLOBAL de Nota de Crédito -- a propósito NO depende de los
   * filtros activos (a diferencia de conteoPorEstatus), para que BCYP/
   * Auditoría siempre vean de un vistazo cuánto falta sin importar qué
   * filtro tengan puesto en ese momento. */
  get conteoNotaCredito(): { estado: 'sin_capturar' | 'pendiente' | 'validada'; label: string; count: number; color: string }[] {
    const conteo = { sin_capturar: 0, pendiente: 0, validada: 0 };
    for (const s of this.solicitudes) {
      conteo[this.estadoNotaCredito(s)]++;
    }
    const etiquetas: Record<'sin_capturar' | 'pendiente' | 'validada', string> = {
      sin_capturar: 'Sin capturar (BCYP)',
      pendiente: 'Por validar (Auditoría)',
      validada: 'Validadas'
    };
    return (['sin_capturar', 'pendiente', 'validada'] as const).map(estado => ({
      estado,
      label: etiquetas[estado],
      count: conteo[estado],
      color: this.colorPorNotaCredito[estado]
    }));
  }

  /** Conteo por estatus de las solicitudes actualmente filtradas/buscadas (no del total sin filtrar). */
  get conteoPorEstatus(): { estatus: string; count: number; color: string }[] {
    const conteo = new Map<string, number>();
    for (const s of this.solicitudesFiltradas) {
      conteo.set(s.estatus, (conteo.get(s.estatus) ?? 0) + 1);
    }
    return (['pendiente', 'validado', 'rechazado'] as const)
      .map(estatus => ({ estatus, count: conteo.get(estatus) ?? 0, color: this.colorPorEstatus[estatus] }))
      .filter(e => e.count > 0);
  }

  seleccionar(s: SolicitudRetroactivo): void {
    this.seleccionada = s;
    this.editandoPrecio = false;
    this.errorPrecio = '';
  }

  cerrarDetalle(): void {
    this.seleccionada = null;
  }

  documentos(solicitud: SolicitudRetroactivo): DocumentoMostrar[] {
    if (!solicitud.archivos) return [];
    return Object.keys(this.etiquetasDoc).map(key => ({
      key,
      label: this.etiquetasDoc[key],
      url: solicitud.archivos?.[key]?.url ?? null,
      estatus: solicitud.archivos?.[key]?.estatus ?? 'pendiente'
    }));
  }

  estaProcesando(doc: string): boolean {
    return this.procesandoDoc.has(doc);
  }

  // GUÍA: validación por archivo, no por solicitud completa -- si solo un
  // documento está mal, el cliente nada más resube ese (ver PUT /venta/<id>
  // en el backend). El estatus general se recalcula con lo que regresa el
  // backend (_calcular_estatus), no hace falta refrescar toda la lista.
  private obtenerUsuarioActual(): string {
    return this.authService.getUserName() || 'Usuario';
  }

  private agregarHistorial(solicitud: SolicitudRetroactivo, item: ItemHistorial): void {
    solicitud.historial = [...(solicitud.historial ?? []), item];
  }

  private normalizarNotaCredito(valor: string): string {
    return valor?.trim().replace(/^'+|'+$/g, '') ?? '';
  }

  validarDocumento(doc: string, estatus: EstatusDocumento): void {
    if (!this.seleccionada) return;
    const solicitud = this.seleccionada;
    this.procesandoDoc.add(doc);

    this.service.validarDocumento(solicitud.id, doc, estatus as 'valido' | 'rechazado').subscribe({
      next: (res) => {
        // GUÍA: NO asumir que el resultado es siempre `estatus` -- el
        // backend hace toggle (click sobre el mismo estatus ya puesto lo
        // deshace, vuelve a 'pendiente'). El estatus real por documento es
        // el que regresa res.validacion_docs, no el que se pidió. Asumirlo
        // era el bug: la UI se quedaba mostrando "validado" después de un
        // click que en realidad lo había deshecho, hasta recargar la página.
        if (solicitud.archivos?.[doc]) {
          solicitud.archivos[doc].estatus = res.validacion_docs?.[doc] ?? 'pendiente';
        }
        solicitud.validacion_docs = res.validacion_docs;
        solicitud.estatus = res.estatus;
        if (res.historial) {
          solicitud.historial = res.historial;
        } else {
          this.agregarHistorial(solicitud, {
            fecha: new Date().toISOString(),
            tipo: 'validacion',
            descripcion: `${this.etiquetasDoc[doc]}: ${estatus === 'valido' ? 'validado' : 'rechazado'}`,
            usuario: this.obtenerUsuarioActual()
          });
        }
        this.procesandoDoc.delete(doc);
      },
      error: () => { this.procesandoDoc.delete(doc); }
    });
  }

  // GUÍA: el precio lo corrige el admin directo (comparándolo contra la
  // factura/ticket adjuntos) en vez de rechazar toda la solicitud por un
  // typo del cliente. El backend recalcula monto_pagar con el % ya guardado.
   iniciarEdicionNotaCredito(): void {
    if (!this.seleccionada) return;
    this.notaCreditoEditada = this.seleccionada.nota_credito;
    this.errorNotaCredito = '';
    this.editandoNotaCredito = true;
  }

  iniciarEdicionPrecio(): void {
    if (!this.seleccionada) return;
    this.precioEditado = this.seleccionada.precio_publico;
    this.errorPrecio = '';
    this.editandoPrecio = true;
  }

  cancelarEdicionNotaCredito(): void {
    this.editandoNotaCredito = false;
    this.errorNotaCredito = '';
  }

  cancelarEdicionPrecio(): void {
    this.editandoPrecio = false;
    this.errorPrecio = '';
  }

  guardarNotaCredito(): void {
    if (!this.seleccionada) return;
    const valor = this.notaCreditoEditada.trim();
    if (!valor) {
      this.errorNotaCredito = 'Nota de crédito inválida.';
      return;
    }

    const solicitud = this.seleccionada;
    const notaAnterior = solicitud.nota_credito;
    this.guardandoNotaCredito = true;
    this.service.corregirNotaCredito(solicitud.id, valor).subscribe({
      next: (res) => {
        solicitud.nota_credito = this.normalizarNotaCredito(String(res.nota_credito));
        // GUÍA: capturar/editar la NC siempre la deja 'pendiente' de
        // validación de Auditoría, aunque ya hubiera estado validada antes.
        solicitud.nota_credito_estatus = 'pendiente';
        if (res.historial) {
          solicitud.historial = this.normalizarHistorial(res.historial);
        } else {
          this.agregarHistorial(solicitud, {
            fecha: new Date().toISOString(),
            tipo: 'nota_credito',
            descripcion: `Nota de crédito corregida de ${this.normalizarTextoNotaCredito(String(notaAnterior))} a ${this.normalizarTextoNotaCredito(String(valor))}`,
            usuario: this.obtenerUsuarioActual()
          });
        }
        this.guardandoNotaCredito = false;
        this.editandoNotaCredito = false;
      },
      error: () => {
        this.guardandoNotaCredito = false;
        this.errorNotaCredito = 'No se pudo guardar la nota de crédito.';
      }
    });
  }

  tituloBotonNotaCredito(s: SolicitudRetroactivo): string {
    return s.nota_credito ? 'Corregir nota de credito' : 'Agregar nota de credito';
  }

  abrirValidarNotaCredito(): void {
    this.codigoAuditoriaDialog = { abierto: true, codigo: '', error: '', verificando: false };
  }

  // GUÍA: el código de Auditoría debe ser solo numérico -- se filtra
  // cualquier otro carácter tanto en el modelo como en el input visible.
  onCodigoAuditoriaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '');
    this.codigoAuditoriaDialog.codigo = soloDigitos;
    if (input.value !== soloDigitos) input.value = soloDigitos;
  }

  cancelarValidarNotaCredito(): void {
    this.codigoAuditoriaDialog.abierto = false;
  }

  confirmarValidarNotaCredito(): void {
    if (!this.seleccionada) return;
    const codigo = this.codigoAuditoriaDialog.codigo.trim();
    if (!codigo) {
      this.codigoAuditoriaDialog.error = 'Ingresa el código de Auditoría.';
      return;
    }

    const solicitud = this.seleccionada;
    this.codigoAuditoriaDialog.verificando = true;
    this.codigoAuditoriaDialog.error = '';

    this.service.validarNotaCredito(solicitud.id, codigo).subscribe({
      next: (res) => {
        solicitud.nota_credito_estatus = 'validada';
        if (res.historial) {
          solicitud.historial = this.normalizarHistorial(res.historial);
        } else {
          this.agregarHistorial(solicitud, {
            fecha: new Date().toISOString(),
            tipo: 'nota_credito',
            descripcion: `Nota de crédito #${solicitud.nota_credito} validada por Auditoría`,
            usuario: this.obtenerUsuarioActual()
          });
        }
        this.codigoAuditoriaDialog.verificando = false;
        this.codigoAuditoriaDialog.abierto = false;
      },
      error: (err) => {
        this.codigoAuditoriaDialog.verificando = false;
        this.codigoAuditoriaDialog.error = err?.error?.error ?? 'Código inválido.';
      }
    });
  }

  guardarPrecio(): void {
    if (!this.seleccionada) return;
    const valor = Number(this.precioEditado.toString().replace(/,/g, ''));
    if (isNaN(valor) || valor < 0) {
      this.errorPrecio = 'Precio inválido.';
      return;
    }

    const solicitud = this.seleccionada;
    const precioAnterior = solicitud.precio_publico;
    this.guardandoPrecio = true;
    this.service.corregirPrecio(solicitud.id, valor).subscribe({
      next: (res) => {
        const precioNuevo = Number(res.precio_publico);
        const montoPagar = Number(res.monto_pagar);
        const montoAplicar = Number(res.monto_aplicar);

        solicitud.precio_publico = Number.isFinite(precioNuevo) ? precioNuevo.toString() : '0';
        solicitud.monto_pagar = Number.isFinite(montoPagar) ? montoPagar.toString() : '0';
        solicitud.monto_aplicar = Number.isFinite(montoAplicar) ? montoAplicar.toString() : '0';

        if (res.historial) {
          solicitud.historial = this.normalizarHistorial(res.historial);
        } else {
          this.agregarHistorial(solicitud, {
            fecha: new Date().toISOString(),
            tipo: 'precio',
            descripcion: `Precio corregido de ${precioAnterior} a ${solicitud.precio_publico}`,
            usuario: this.obtenerUsuarioActual()
          });
        }
        this.guardandoPrecio = false;
        this.editandoPrecio = false;
      },
      error: () => {
        this.guardandoPrecio = false;
        this.errorPrecio = 'No se pudo guardar el precio.';
      }
    });
  }
}
