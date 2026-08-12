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
        if (solicitud.archivos?.[doc]) {
          solicitud.archivos[doc].estatus = estatus;
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
