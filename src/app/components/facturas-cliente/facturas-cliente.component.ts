import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientesService } from '../../services/clientes.service';
import * as XLSX from 'xlsx';
import { Observable } from 'rxjs';

/**
 * Modelo de datos que representa una línea de orden de venta.
 * Cada instancia corresponde a un producto dentro de una orden.
 */
interface Factura {
  id: number;
  /** ID / nombre de la orden de venta en Odoo (ej. S04916) */
  numero_factura: string;
  /** SKU / clave interna del producto */
  referencia_interna: string;
  /** Nombre descriptivo del producto */
  nombre_producto: string;
  contacto_referencia: string;
  contacto_nombre: string;
  /** Fecha de la orden o de la factura relacionada */
  fecha_factura: string;
  precio_unitario: number;
  /** Cantidad pedida en la línea */
  cantidad: number;
  venta_total: number;
  marca: string;
  subcategoria: string;
  apparel: string;
  eride: string;
  evac: string;
  categoria_producto: string;
  /** Estatus de entrega del producto (Entregado, En inventario, En tránsito, Falta de confirmación, Cancelado) */
  estado_factura: string;
  /** Estado de la orden de venta en Odoo (Orden Confirmada, Cotización, etc.) */
  estado_orden: string;
  /** Cantidad físicamente entregada según stock.move de Odoo */
  cantidad_entregada: number;
}

/**
 * Componente modal "Detalles de Compra".
 *
 * Muestra el histórico de órdenes de venta de un cliente consultando
 * directamente Odoo vía el backend Flask. Soporta:
 * - Paginación local (50 filas por página)
 * - Filtrado por estatus de entrega (pestañas dinámicas)
 * - Búsqueda en tiempo real por SKU, producto o pedido
 * - Exportación a Excel con formato de moneda
 * - Bloqueo del scroll del body mientras el modal está abierto
 */
@Component({
  selector: 'app-facturas-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturas-cliente.component.html',
  styleUrls: ['./facturas-cliente.component.css']
})
export class FacturasClienteComponent implements OnInit, OnDestroy {
  /** Emite cuando el usuario cierra el modal. El padre debe poner isOpen = false. */
  @Output() onClose = new EventEmitter<void>();
  /** Controla la visibilidad del modal. Al pasar a true se dispara la carga de datos. */
  @Input() isOpen = false;

  /** ID del grupo de clientes (modo portal multi-empresa). Alternativo a clienteClave. */
  @Input() idGrupo: number | null = null;
  /** Clave o nombre del cliente para consultar Odoo directamente. */
  @Input() clienteClave: string | null = null;
  /**
   * ID del grupo integral para Vista Global: el backend consulta la DB por todas las claves
   * del grupo y luego Odoo con ref IN [claves]. Tiene prioridad sobre clienteClave e idGrupo.
   */
  @Input() idGrupoOdoo: number | null = null;
  /**
   * Cuando true, la búsqueda en Odoo se hace con match exacto por `ref`.
   * Se activa solo en "Mis Pedidos" de usuarios integrales para evitar
   * matches parciales por nombre o referencia parecida.
   */
  @Input() claveExacta = false;

  /** Lista completa de líneas de orden recibidas del backend. */
  facturas: Factura[] = [];
  /** Lista tras aplicar filtro de pestaña y búsqueda de texto. */
  facturasFiltradas: Factura[] = [];
  /** Subconjunto de facturasFiltradas correspondiente a la página actual. */
  facturasPaginadas: Factura[] = [];
  cargando = false;
  error: string | null = null;
  infoCliente: any = null;
  /** Referencia al timeout de aviso de carga lenta. */
  loadingTimer: any = null;

  // ── Paginación ────────────────────────────────────────────────────────────
  paginaActual = 1;
  elementosPorPagina = 50;
  totalPaginas = 1;

  // ── Pestañas por estatus de entrega ───────────────────────────────────────
  /** Lista dinámica de pestañas generadas a partir de los estatus presentes en los datos. */
  tabsDisponibles: string[] = [];
  /** Pestaña actualmente activa ("Todas" o un estatus específico). */
  tabActiva = 'Todas';
  /** Índice de tabActiva dentro de tabsDisponibles (para la navegación Anterior/Siguiente). */
  indiceTabActiva = 0;

  // ── Buscador ───────────────────────────────────────────────────────────────
  /** Cadena de texto ingresada por el usuario para filtrar resultados. */
  textoBusqueda = '';

  constructor(private clientesService: ClientesService) { }

  /** Ciclo de vida: sin lógica de inicialización (la carga se dispara en ngOnChanges). */
  ngOnInit() {}

  /**
   * Detecta cambios en los @Input.
   * - Cuando isOpen pasa a true: bloquea el scroll del body y carga los datos.
   * - Cuando isOpen pasa a false: restaura el scroll del body.
   */
  ngOnChanges() {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
      this.obtenerFacturas();
    } else {
      document.body.style.overflow = '';
    }
  }

  /**
   * Ciclo de vida: restaura el scroll del body al destruir el componente
   * (ej. si el padre lo elimina del DOM sin pasar isOpen = false).
   */
  ngOnDestroy() {
    document.body.style.overflow = '';
  }

  /**
   * Carga las órdenes de venta desde el backend.
   *
   * Flujo de decisión:
   * 1. Si se provee `idGrupo` → usa el endpoint de grupo (portal multi-empresa).
   * 2. Si se provee `clienteClave` → consulta Odoo directamente via `/detalle-compras-odoo`.
   * 3. Fallback → intenta obtener el cliente del token JWT del usuario autenticado.
   *
   * En todos los casos, al terminar llama a `filtrarFacturas()` para construir
   * las pestañas y aplicar los filtros iniciales.
   */
  /** Mapea valores raw de Odoo/DB a etiquetas en español para estado_factura. */
  private readonly ESTADO_FACTURA_LABELS: Record<string, string> = {
    'posted':   'Facturado',
    'draft':    'Borrador',
    'cancel':   'Cancelada',
    'paid':     'Pagado',
    'in_payment': 'En pago',
  };

  /** Convierte un estado raw a su etiqueta legible; si ya es legible lo deja. */
  private mapEstadoFactura(raw: string): string {
    if (!raw) return '';
    return this.ESTADO_FACTURA_LABELS[raw] ?? raw;
  }

  obtenerFacturas() {
    this.cargando = true;
    this.error = null;
    this.facturas = [];
    this.facturasFiltradas = [];
    this.facturasPaginadas = [];
    this.tabsDisponibles = [];
    this.tabActiva = 'Todas';
    this.indiceTabActiva = 0;
    this.textoBusqueda = '';

    // ── RUTA 0: Vista Global integral ← prioridad más alta ───────────────────────
    if (this.idGrupoOdoo) {
      this.clientesService.getDetalleComprasCliente(
        undefined, undefined, undefined, undefined, false, this.idGrupoOdoo
      ).subscribe({
        next: (response: any) => {
          if (this.loadingTimer) { clearTimeout(this.loadingTimer); this.loadingTimer = null; }
          const rows = response.rows ?? response.data ?? [];
          this.facturas = (rows || []).map((r: any) => ({
            id: r.id || 0,
            numero_factura: r.numero_factura ?? r.numero ?? r.factura ?? '',
            referencia_interna: r.clave_producto != null && r.clave_producto !== false ? String(r.clave_producto) : (r.referencia_interna ?? ''),
            nombre_producto: r.producto ?? r.nombre_producto ?? r.descripcion ?? '',
            contacto_referencia: r.contacto_referencia ?? '',
            contacto_nombre: r.contacto_nombre ?? '',
            fecha_factura: r.fecha ?? r.fecha_factura ?? '',
            precio_unitario: Number(r.precio_unitario ?? r.precio ?? 0) || 0,
            cantidad: Number(r.cantidad ?? r.qty ?? 0) || 0,
            venta_total: Number(r.total ?? r.venta_total ?? 0) || 0,
            marca: r.marca ?? '',
            subcategoria: r.subcategoria ?? '',
            apparel: r.apparel ?? '',
            eride: r.eride ?? '',
            evac: r.cliente ?? r.evac ?? '',
            categoria_producto: r.categoria_producto ?? '',
            estado_factura: this.mapEstadoFactura(r.estatus_out ?? r.estado_factura ?? ''),
            estado_orden: r.estado_orden ?? '',
            cantidad_entregada: Number(r.cantidad_entregada ?? 0) || 0
          }));
          if (this.facturas.length === 0) {
            this.error = 'No se encontraron pedidos para este grupo.';
          } else {
            this.filtrarFacturas();
          }
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error Vista Global grupo Odoo:', error);
          this.error = error.error?.error || 'Error al cargar los pedidos del grupo';
          if (this.loadingTimer) { clearTimeout(this.loadingTimer); this.loadingTimer = null; }
          this.cargando = false;
        }
      });
      this.loadingTimer = setTimeout(() => {
        if (this.cargando) {
          this.error = 'La consulta está tardando más de lo esperado. Por favor espera o intenta más tarde.';
        }
      }, 8000);
      return;   // no continuar con las rutas siguientes
    }

    if (this.idGrupo) {
      this.clientesService.getFacturasGrupo(this.idGrupo).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.facturas = (response.data || []).map((r: any) => ({
              ...r,
              estado_factura: this.mapEstadoFactura(r.estado_factura ?? '')
            }));
            this.infoCliente = response.cliente ?? null;
            if (this.facturas.length === 0) {
              this.error = 'No se encontraron facturas.';
            } else {
              this.filtrarFacturas();
            }
          } else {
            this.error = response.error || 'Error al obtener facturas';
          }
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al obtener facturas (grupo):', error);
          this.error = error.error?.error || 'Error al cargar las facturas';
          this.cargando = false;
        }
      });
    } else {
      // If parent provided the client key, use it. Otherwise try token-backed info endpoint as fallback.
      const clienteParam = this.clienteClave ?? null;
      if (clienteParam) {
        this.infoCliente = { nombre_cliente: clienteParam };
        // Sin límite: traer todos los registros; la paginación local se encarga de mostrarlos por páginas
        this.clientesService.getDetalleComprasCliente(undefined, undefined, undefined, clienteParam, this.claveExacta).subscribe({
            next: (response: any) => {
            if (this.loadingTimer) { clearTimeout(this.loadingTimer); this.loadingTimer = null; }
              // Accept responses that contain rows/data even if they don't include a `success` flag
              const hasRows = Array.isArray(response?.rows) && response.rows.length > 0;
              const hasData = Array.isArray(response?.data) && response.data.length > 0;
              if (response?.success || hasRows || hasData) {
                const rows = response.rows ?? response.data ?? [];
              this.facturas = (rows || []).map((r: any) => ({
                id: r.id || 0,
                numero_factura: r.numero_factura ?? r.numero ?? r.factura ?? '',
                referencia_interna: r.clave_producto != null && r.clave_producto !== false ? String(r.clave_producto) : (r.referencia_interna ?? ''),
                nombre_producto: r.producto ?? r.nombre_producto ?? r.descripcion ?? '',
                contacto_referencia: r.contacto_referencia ?? '',
                contacto_nombre: r.contacto_nombre ?? '',
                fecha_factura: r.fecha ?? r.fecha_factura ?? '',
                precio_unitario: Number(r.precio_unitario ?? r.precio ?? 0) || 0,
                cantidad: Number(r.cantidad ?? r.qty ?? r.cantidad_entregada ?? 0) || 0,
                venta_total: Number(r.total ?? r.venta_total ?? 0) || 0,
                marca: r.marca ?? '',
                subcategoria: r.subcategoria ?? '',
                apparel: r.apparel ?? '',
                eride: r.eride ?? '',
                evac: r.cliente ?? r.evac ?? '',
                categoria_producto: r.categoria_producto ?? '',
                estado_factura: this.mapEstadoFactura(r.estatus_out ?? r.estado_factura ?? ''),
                estado_orden: r.estado_orden ?? '',
                cantidad_entregada: Number(r.cantidad_entregada ?? 0) || 0
              }));

              if (this.facturas.length === 0) {
                this.error = 'No se encontraron facturas.';
              } else {
                this.filtrarFacturas();
              }
            } else {
              console.warn('getDetalleComprasCliente returned no rows:', response);
              this.error = response.error || 'Error al obtener facturas';
            }
            this.cargando = false;
          },
          error: (error) => {
            console.error('Error al obtener detalle compras (cliente param):', error);
            this.error = error.error?.error || 'Error al cargar las facturas';
            if (this.loadingTimer) { clearTimeout(this.loadingTimer); this.loadingTimer = null; }
            this.cargando = false;
          }
        });
        // show a friendly timeout message if the request is slow
        this.loadingTimer = setTimeout(() => {
          if (this.cargando) {
            this.error = 'La consulta está tardando más de lo esperado. Por favor espera o intenta más tarde.';
          }
        }, 8000);
      } else if (this.claveExacta) {
        // "Mis Pedidos" mode pero sin clave asignada → usuario nuevo sin órdenes propias
        this.error = 'Aún no tienes pedidos registrados a tu nombre.';
        this.cargando = false;
      } else {
        // Fallback: try the token-backed info endpoint (may 401 if token missing)
        this.clientesService.getInfoClienteActual().subscribe({
          next: (resp: any) => {
            const clienteInfo = resp?.cliente ?? null;
            this.infoCliente = clienteInfo ?? null;
            const clienteParam2 = clienteInfo?.nombre_cliente ?? clienteInfo?.clave ?? null;
            if (!clienteParam2) {
              this.error = 'No se pudo determinar el cliente actual.';
              this.cargando = false;
              return;
            }
            this.clientesService.getDetalleComprasCliente(undefined, undefined, undefined, clienteParam2, this.claveExacta).subscribe({
              next: (response: any) => {
                if (this.loadingTimer) { clearTimeout(this.loadingTimer); this.loadingTimer = null; }
                const hasRows2 = Array.isArray(response?.rows) && response.rows.length > 0;
                const hasData2 = Array.isArray(response?.data) && response.data.length > 0;
                if (response?.success || hasRows2 || hasData2) {
                  const rows = response.rows ?? response.data ?? [];
                  this.facturas = (rows || []).map((r: any) => ({
                    id: r.id || 0,
                    numero_factura: r.numero_factura ?? r.numero ?? r.factura ?? '',
                    referencia_interna: r.clave_producto != null && r.clave_producto !== false ? String(r.clave_producto) : (r.referencia_interna ?? ''),
                    nombre_producto: r.producto ?? r.nombre_producto ?? r.descripcion ?? '',
                    contacto_referencia: r.contacto_referencia ?? '',
                    contacto_nombre: r.contacto_nombre ?? '',
                    fecha_factura: r.fecha ?? r.fecha_factura ?? '',
                    precio_unitario: Number(r.precio_unitario ?? r.precio ?? 0) || 0,
                    cantidad: Number(r.cantidad ?? r.qty ?? r.cantidad_entregada ?? 0) || 0,
                    venta_total: Number(r.total ?? r.venta_factura ?? 0) || 0,
                    marca: r.marca ?? '',
                    subcategoria: r.subcategoria ?? '',
                    apparel: r.apparel ?? '',
                    eride: r.eride ?? '',
                    evac: r.cliente ?? r.evac ?? '',
                    categoria_producto: r.categoria_producto ?? '',
                    estado_factura: this.mapEstadoFactura(r.estatus_out ?? r.estado_factura ?? ''),
                    estado_orden: r.estado_orden ?? '',
                    cantidad_entregada: Number(r.cantidad_entregada ?? 0) || 0
                  }));

                  if (this.facturas.length === 0) {
                    this.error = 'No se encontraron facturas.';
                  } else {
                    this.filtrarFacturas();
                  }
                } else {
                  console.warn('getDetalleComprasCliente (fallback) returned no rows:', response);
                  this.error = response.error || 'Error al obtener facturas';
                }
                this.cargando = false;
              },
              error: (error) => {
                console.error('Error al obtener detalle compras (fallback):', error);
                this.error = error.error?.error || 'Error al cargar las facturas';
                if (this.loadingTimer) { clearTimeout(this.loadingTimer); this.loadingTimer = null; }
                this.cargando = false;
              }
            });
            this.loadingTimer = setTimeout(() => {
              if (this.cargando) {
                this.error = 'La consulta está tardando más de lo esperado. Por favor espera o intenta más tarde.';
              }
            }, 8000);
          },
          error: (err) => {
            console.error('Error al obtener info cliente actual:', err);
            this.error = 'No se pudo obtener la información del cliente.';
            this.cargando = false;
          }
        });
      }
    }
  }

  /**
   * Aplica los filtros activos sobre `facturas` y actualiza `facturasFiltradas`.
   *
   * Pasos:
   * 1. Construye `tabsDisponibles` con los estatus únicos presentes en los datos.
   * 2. Filtra por `tabActiva` (estatus de entrega).
   * 3. Filtra por `textoBusqueda` (SKU, nombre de producto, ID de pedido o contacto).
   * 4. Recalcula `totalPaginas` y va a la página 1.
   *
   * Se llama automáticamente al cargar datos, cambiar pestaña o escribir en el buscador.
   */
  filtrarFacturas() {
    // Construir pestañas únicas por estatus de entrega (estado_factura / estatus_out)
    const estatusUnicos = [...new Set(
      this.facturas.map(f => f.estado_factura).filter(e => !!e)
    )].sort();
    this.tabsDisponibles = estatusUnicos.length > 1 ? ['Todas', ...estatusUnicos] : [];

    // Aplicar filtro de pestaña activa
    let base: Factura[];
    if (this.tabActiva !== 'Todas' && this.tabsDisponibles.includes(this.tabActiva)) {
      base = this.facturas.filter(f => f.estado_factura === this.tabActiva);
    } else {
      this.tabActiva = this.tabsDisponibles.length > 0 ? 'Todas' : '';
      this.indiceTabActiva = 0;
      base = [...this.facturas];
    }

    // Aplicar filtro de texto (SKU, nombre, pedido, contacto)
    const q = this.textoBusqueda.trim().toLowerCase();
    if (q) {
      this.facturasFiltradas = base.filter(f =>
        String(f.referencia_interna ?? '').toLowerCase().includes(q) ||
        String(f.nombre_producto ?? '').toLowerCase().includes(q) ||
        String(f.numero_factura ?? '').toLowerCase().includes(q) ||
        String(f.contacto_nombre ?? '').toLowerCase().includes(q)
      );
    } else {
      this.facturasFiltradas = base;
    }

    this.totalPaginas = Math.ceil(this.facturasFiltradas.length / this.elementosPorPagina);
    this.cambiarPagina(1);
  }

  /**
   * Activa la pestaña indicada y recalcula el filtro.
   * @param tab Nombre de la pestaña (ej. 'Entregado', 'Todas')
   */
  seleccionarTab(tab: string) {
    this.tabActiva = tab;
    this.indiceTabActiva = this.tabsDisponibles.indexOf(tab);
    this.filtrarFacturas();
  }

  /** Navega a la siguiente pestaña disponible. No hace nada si ya está en la última. */
  tabSiguiente() {
    if (this.indiceTabActiva < this.tabsDisponibles.length - 1) {
      this.seleccionarTab(this.tabsDisponibles[this.indiceTabActiva + 1]);
    }
  }

  /** Navega a la pestaña anterior. No hace nada si ya está en la primera. */
  tabAnterior() {
    if (this.indiceTabActiva > 0) {
      this.seleccionarTab(this.tabsDisponibles[this.indiceTabActiva - 1]);
    }
  }

  /**
   * Devuelve el número de filas que pertenecen a una pestaña.
   * Para 'Todas' retorna el total de `facturas` sin filtrar.
   * @param tab Nombre de la pestaña
   */
  contarTab(tab: string): number {
    if (tab === 'Todas') return this.facturas.length;
    return this.facturas.filter(f => f.estado_factura === tab).length;
  }

  /** Limpia el texto del buscador y recalcula el filtro. */
  limpiarBusqueda() {
    this.textoBusqueda = '';
    this.filtrarFacturas();
  }

  /**
   * Devuelve la clase CSS del badge de estatus de entrega.
   * Mapa de colores:
   * - Entregado / Entregado Parcial → verde
   * - En inventario → azul
   * - En tránsito → amarillo
   * - Falta de confirmación → gris
   * - Cancelado → rojo
   * @param estado Estatus de entrega del producto
   */
  getBadgeClase(estado: string): string {
    const mapa: Record<string, string> = {
      'Entregado':            'badge-confirmada',
      'Entregado Parcial':    'badge-confirmada',
      'En inventario':        'badge-bloqueada',
      'En tránsito':          'badge-cotizacion',
      'Falta de confirmación':'badge-otro',
      'Cancelado':            'badge-cancelada',
      'Facturado':            'badge-facturado',
      'Borrador':             'badge-otro',
      'Pagado':               'badge-confirmada',
      'En pago':              'badge-cotizacion',
    };
    return mapa[estado] ?? 'badge-otro';
  }

  /**
   * Cambia a la página indicada y actualiza `facturasPaginadas`.
   * Ignora valores fuera del rango [1, totalPaginas].
   * @param numero Número de página destino
   */
  cambiarPagina(numero: number) {
    if (numero < 1 || numero > this.totalPaginas) return;
    this.paginaActual = numero;
    this.actualizarFacturasPaginadas();
  }

  /**
   * Recorta `facturasFiltradas` al slice de la página actual
   * y lo asigna a `facturasPaginadas` para que el template lo renderice.
   */
  actualizarFacturasPaginadas() {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    this.facturasPaginadas = this.facturasFiltradas.slice(inicio, fin);
  }

  /**
   * Exporta `facturasFiltradas` (respetando la pestaña y búsqueda activas)
   * a un archivo .xlsx con formato de moneda en las columnas numéricas.
   * El nombre del archivo incluye la clave del cliente y la fecha actual.
   */
  exportarExcel() {
    const datosExportar = this.facturasFiltradas.map(factura => {
      const fila: any = {};
      fila['Número Pedido'] = factura.numero_factura ?? '';
      fila['Clave Producto'] = factura.referencia_interna ?? '';
      fila['Producto'] = factura.nombre_producto ?? '';
      fila['Fecha'] = factura.fecha_factura ? new Date(factura.fecha_factura).toISOString().slice(0, 10) : '';
      fila['Precio Unit.'] = this.formatearNumeroParaExcel(factura.precio_unitario);
      fila['Cantidad Pedida'] = Number(factura.cantidad ?? 0);
      fila['Cantidad Entregada'] = Number(factura.cantidad_entregada ?? 0);
      fila['Total'] = this.formatearNumeroParaExcel(factura.venta_total);
      fila['Estatus Entrega'] = factura.estado_factura ?? '';
      fila['Estado Orden'] = factura.estado_orden ?? '';
      fila['Cliente / EVAC'] = factura.evac ?? '';
      fila['Marca'] = factura.marca ?? '';
      fila['Subcategoría'] = factura.subcategoria ?? '';
      return fila;
    });

    // Fila de totales al final
    const filaTotal: any = {};
    filaTotal['Número Pedido'] = 'TOTALES';
    filaTotal['Clave Producto'] = '';
    filaTotal['Producto'] = '';
    filaTotal['Fecha'] = '';
    filaTotal['Precio Unit.'] = '';
    filaTotal['Cantidad Pedida'] = this.totalCantidad;
    filaTotal['Cantidad Entregada'] = this.totalEntregado;
    filaTotal['Total'] = this.formatearNumeroParaExcel(this.totalMonto);
    filaTotal['Estatus Entrega'] = '';
    filaTotal['Estado Orden'] = '';
    filaTotal['Cliente / EVAC'] = '';
    filaTotal['Marca'] = '';
    filaTotal['Subcategoría'] = '';
    datosExportar.push(filaTotal);

    const worksheet = XLSX.utils.json_to_sheet(datosExportar);

    const headers = [
      'Número Pedido', 'Clave Producto', 'Producto', 'Fecha',
      'Precio Unit.', 'Cantidad Pedida', 'Cantidad Entregada', 'Total',
      'Estatus Entrega', 'Estado Orden', 'Cliente / EVAC', 'Marca', 'Subcategoría'
    ];

    const colWidths = headers.map(header => {
      const valores = datosExportar.map(row => row[header]?.toString() ?? '');
      valores.push(header);
      const maxLength = Math.max(...valores.map(v => v.length));
      return { wch: Math.min(maxLength + 2, 55) };
    });
    worksheet['!cols'] = colWidths;

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    const columnasMoneda = ['Precio Unit.', 'Total'];
    const columnasEntero = ['Cantidad Pedida', 'Cantidad Entregada'];
    const filaTotal_R = range.e.r; // última fila = fila de totales

    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
        const celda = worksheet[cell_ref];
        if (!celda) continue;
        const headerName = headers[C];
        if (celda.t === 'n' && columnasMoneda.includes(headerName)) {
          celda.z = '#,##0.00';
        }
        if (celda.t === 'n' && columnasEntero.includes(headerName)) {
          celda.z = '#,##0';
        }
        // Negrita en la fila de totales
        if (R === filaTotal_R) {
          celda.s = { font: { bold: true } };
        }
      }
    }
    // Negrita en celda TOTALES (texto)
    const celdaTotalesRef = XLSX.utils.encode_cell({ c: 0, r: filaTotal_R });
    if (worksheet[celdaTotalesRef]) {
      worksheet[celdaTotalesRef].s = { font: { bold: true } };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalle Compras');

    const tabLabel = this.tabActiva && this.tabActiva !== 'Todas' ? `_${this.tabActiva.replace(/ /g, '_')}` : '';
    const fileName = `compras_${this.infoCliente?.clave || 'cliente'}${tabLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  /**
   * Convierte cualquier valor a `number` para garantizar que Excel
   * lo trate como celda numérica y no como texto.
   * @param valor Valor a convertir (string, number, null, undefined)
   */
  private formatearNumeroParaExcel(valor: any): number {
    if (valor === null || valor === undefined) return 0;
    if (typeof valor === 'string') {
      const numeroLimpio = valor.replace(/[^\d.-]/g, '');
      return parseFloat(numeroLimpio) || 0;
    }
    return Number(valor) || 0;
  }

  /**
   * Formatea una fecha ISO a formato local `dd/mm/yyyy` para mostrar en la tabla.
   * Si la cadena no es válida, la retorna tal cual.
   * @param fechaStr Fecha en formato ISO o similar
   */
  formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toLocaleDateString('es-ES');
  }

  /**
   * Formatea una fecha ISO a `YYYY-MM-DD` para usar en la exportación Excel
   * (formato que Excel reconoce como fecha nativa).
   * @param fechaStr Fecha en formato ISO o similar
   */
  formatearFechaParaExcel(fechaStr: string): string {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return fechaStr;
    return fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD para Excel
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
  }

  /** Suma total de piezas pedidas en la vista filtrada activa. */
  get totalCantidad(): number {
    return this.facturasFiltradas.reduce((acc, f) => acc + (f.cantidad || 0), 0);
  }

  /** Suma total de piezas entregadas en la vista filtrada activa. */
  get totalEntregado(): number {
    return this.facturasFiltradas.reduce((acc, f) => acc + (f.cantidad_entregada || 0), 0);
  }

  /** Suma total del importe (venta_total) en la vista filtrada activa. */
  get totalMonto(): number {
    return this.facturasFiltradas.reduce((acc, f) => acc + (f.venta_total || 0), 0);
  }

  /**
   * Cierra el modal: restaura el scroll del body y emite el evento `onClose`
   * para que el componente padre actualice su estado (`isOpen = false`).
   */
  closeModal() {
    document.body.style.overflow = '';
    this.onClose.emit();
  }
}