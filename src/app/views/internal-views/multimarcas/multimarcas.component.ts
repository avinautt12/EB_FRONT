import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultimarcasService } from '../../../services/multimarcas.service';
import { MonitorOdooService } from '../../../services/monitor-odoo.service';
import { HomeBarComponent } from '../../../components/home-bar/home-bar.component';
import { finalize } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { FiltroPrevioComponent } from '../../../components/filtro-previo/filtro-previo.component';

@Component({
  selector: 'app-multimarcas',
  standalone: true,
  imports: [CommonModule, FormsModule, HomeBarComponent, RouterModule, FiltroPrevioComponent],
  templateUrl: './multimarcas.component.html',
  styleUrls: ['./multimarcas.component.css']
})
export class MultimarcasComponent implements OnInit {

  clientesPaginados: any[] = [];
  clientesOriginales: any[] = [];
  facturasOriginales: any[] = [];
  cargando: boolean = false;

  // Opciones para los filtros
  opcionesClave: { value: string; selected: boolean; }[] = [];
  opcionesEvac: { value: string; selected: boolean; }[] = [];
  opcionesCliente: { value: string; selected: boolean; }[] = [];

  // Filtros activos
  filtroClaveActivo: string[] = [];
  filtroEvacActivo: string[] = [];
  filtroClienteActivo: string[] = [];

  constructor(
    private multimarcasService: MultimarcasService,
    private monitorOdooService: MonitorOdooService
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.cargando = true;

    // Cargamos primero los clientes
    this.multimarcasService.getMultimarcas().subscribe({
      next: (clientes) => {
        this.clientesOriginales = [...clientes];
        this.clientesPaginados = [...clientes];

        this.generarOpcionesFiltros();

        // Luego cargamos las facturas
        this.monitorOdooService.getFacturas().pipe(
          finalize(() => this.cargando = false)
        ).subscribe({
          next: (facturas) => {
            this.facturasOriginales = facturas;
            this.calcularAvanceGlobalScott();
            this.calcularAvanceGlobalSyncros();
            this.calcularAvanceGlobalApparel();
            this.calcularAvanceGlobalVittoria();
            this.calcularAvanceGlobalBold();
            this.calcularAvanceGlobalSoloJulio();
            this.calcularAvanceGlobalSoloAgosto();
            this.calcularAvanceGlobalSoloSeptiembre();
            this.calcularAvanceGlobalSoloOctubre();
            this.calcularAvanceGlobalSoloNoviembre();
            this.calcularAvanceGlobalSoloDiciembre();
            this.calcularAvanceGlobalSoloEnero();
            this.calcularAvanceGlobalSoloFebrero();
            this.calcularAvanceGlobalSoloMarzo();
            this.calcularAvanceGlobalSoloAbril();
            this.calcularAvanceGlobalSoloMayo();
            this.calcularAvanceGlobalSoloJunio();
          },
          error: (error) => {
            console.error('Error al cargar facturas:', error);
          }
        });
      },
      error: (error) => {
        this.cargando = false;
        console.error('Error al cargar clientes:', error);
      }
    });
  }

  generarOpcionesFiltros() {
    // Extraer todas las claves únicas y convertir al formato esperado
    const clavesUnicas = [...new Set(this.clientesOriginales.map(cliente => cliente.clave))]
      .filter(clave => clave) // Filtrar valores nulos/undefined
      .sort();

    this.opcionesClave = clavesUnicas.map(clave => ({
      value: clave,
      selected: false
    }));

    // Extraer todos los EVACs únicos y convertir al formato esperado
    const evacsUnicos = [...new Set(this.clientesOriginales.map(cliente => cliente.evac))]
      .filter(evac => evac) // Filtrar valores nulos/undefined
      .sort();

    this.opcionesEvac = evacsUnicos.map(evac => ({
      value: evac,
      selected: false
    }));

    // Extraer todos los Clientes únicos y convertir al formato esperado
    const clientesUnicos = [...new Set(this.clientesOriginales.map(cliente => cliente.cliente_razon_social))]
      .filter(cliente => cliente) // Filtrar valores nulos/undefined
      .sort();

    this.opcionesCliente = clientesUnicos.map(cliente => ({
      value: cliente,
      selected: false
    }));
  }

  // Métodos para manejar el filtro de Clave
  aplicarFiltroClave(valoresFiltro: string[]) {
    this.filtroClaveActivo = valoresFiltro;
    this.aplicarFiltros();
  }

  limpiarFiltroClave() {
    this.filtroClaveActivo = [];
    this.aplicarFiltros();
  }

  // Métodos para manejar el filtro de EVAC
  aplicarFiltroEvac(valoresFiltro: string[]) {
    this.filtroEvacActivo = valoresFiltro;
    this.aplicarFiltros();
  }

  limpiarFiltroEvac() {
    this.filtroEvacActivo = [];
    this.aplicarFiltros();
  }

  // Métodos para manejar el filtro de Cliente
  aplicarFiltroCliente(valoresFiltro: string[]) {
    this.filtroClienteActivo = valoresFiltro;
    this.aplicarFiltros();
  }

  limpiarFiltroCliente() {
    this.filtroClienteActivo = [];
    this.aplicarFiltros();
  }

  // Método principal que aplica todos los filtros
  aplicarFiltros() {
    let clientesFiltrados = [...this.clientesOriginales];

    if (this.filtroClaveActivo.length > 0) {
      clientesFiltrados = clientesFiltrados.filter(cliente =>
        cliente.clave && this.filtroClaveActivo.includes(cliente.clave)
      );
    }

    // Aplicar filtro de EVAC
    if (this.filtroEvacActivo.length > 0) {
      clientesFiltrados = clientesFiltrados.filter(cliente =>
        cliente.evac && this.filtroEvacActivo.includes(cliente.evac)
      );
    }

    if (this.filtroClienteActivo.length > 0) {
      clientesFiltrados = clientesFiltrados.filter(cliente =>
        cliente.cliente_razon_social &&
        this.filtroClienteActivo.some(filtro =>
          cliente.cliente_razon_social.toLowerCase() === filtro.toLowerCase()
        )
      );
    }

    this.clientesPaginados = clientesFiltrados;
    this.recalcularAvances(); // <-- Añade esta línea
  }

  // Nueva función para recalcular todos los avances
  recalcularAvances() {
    this.calcularAvanceGlobalScott();
    this.calcularAvanceGlobalSyncros();
    this.calcularAvanceGlobalApparel();
    this.calcularAvanceGlobalVittoria();
    this.calcularAvanceGlobalBold();
    this.calcularAvanceGlobalSoloJulio();
    this.calcularAvanceGlobalSoloAgosto();
    this.calcularAvanceGlobalSoloSeptiembre();
    this.calcularAvanceGlobalSoloOctubre();
    this.calcularAvanceGlobalSoloNoviembre();
    this.calcularAvanceGlobalSoloDiciembre();
    this.calcularAvanceGlobalSoloEnero();
    this.calcularAvanceGlobalSoloFebrero();
    this.calcularAvanceGlobalSoloMarzo();
    this.calcularAvanceGlobalSoloAbril();
    this.calcularAvanceGlobalSoloMayo();
    this.calcularAvanceGlobalSoloJunio();
  }

  calcularAvanceGlobalScott() {
    const avancesPorCliente = new Map<string, number>();

    // Filtramos facturas SCOTT con apparel NO y dentro del rango de fechas
    const facturasFiltradas = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const fechaInicio = new Date('2025-07-01');
        const fechaFin = new Date('2026-06-30');

        return factura.marca === 'SCOTT' &&
          factura.apparel === 'NO' &&
          fechaFactura >= fechaInicio &&
          fechaFactura <= fechaFin;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumamos los montos por cliente
    facturasFiltradas.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizamos los clientes con los avances calculados
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        avance_global_scott: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSyncros() {
    const avancesPorCliente = new Map<string, number>();

    const facturasFiltradas = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const fechaInicio = new Date('2025-07-01');
        const fechaFin = new Date('2026-06-30');

        return factura.marca === 'SYNCROS' &&
          fechaFactura >= fechaInicio &&
          fechaFactura <= fechaFin;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumamos los montos por cliente
    facturasFiltradas.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizamos los clientes con los avances calculados
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        avance_global_syncros: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalApparel() {
    const avancesPorCliente = new Map<string, number>();

    const facturasFiltradas = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const fechaInicio = new Date('2025-07-01');
        const fechaFin = new Date('2026-06-30');

        return factura.apparel === 'SI' &&
          fechaFactura >= fechaInicio &&
          fechaFactura <= fechaFin;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumamos los montos por cliente
    facturasFiltradas.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizamos los clientes con los avances calculados
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        avance_global_apparel: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalVittoria() {
    const avancesPorCliente = new Map<string, number>();

    const facturasFiltradas = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const fechaInicio = new Date('2025-07-01');
        const fechaFin = new Date('2026-06-30');

        return factura.marca === 'VITTORIA' &&
          fechaFactura >= fechaInicio &&
          fechaFactura <= fechaFin;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumamos los montos por cliente
    facturasFiltradas.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizamos los clientes con los avances calculados
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        avance_global_vittoria: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalBold() {
    const avancesPorCliente = new Map<string, number>();

    const facturasFiltradas = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const fechaInicio = new Date('2025-07-01');
        const fechaFin = new Date('2026-06-30');

        return factura.marca === 'BOLD' &&
          fechaFactura >= fechaInicio &&
          fechaFactura <= fechaFin;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumamos los montos por cliente
    facturasFiltradas.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizamos los clientes con los avances calculados
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        avance_global_bold: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloJulio() {
    const avancesPorCliente = new Map<string, number>();

    const facturasJulio = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioJulio = new Date('2025-07-01');
        const finJulio = new Date('2025-07-31');

        return fechaFactura >= inicioJulio &&
          fechaFactura <= finJulio;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasJulio.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_julio: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloAgosto() {
    const avancesPorCliente = new Map<string, number>();

    const facturasAgosto = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioAgosto = new Date('2025-08-01');
        const finAgosto = new Date('2025-08-31');

        return fechaFactura >= inicioAgosto &&
          fechaFactura <= finAgosto;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasAgosto.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_agosto: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloSeptiembre() {
    const avancesPorCliente = new Map<string, number>();

    const facturasSeptiembre = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioSeptiembre = new Date('2025-09-01');
        const finSeptiembre = new Date('2025-09-30');

        return fechaFactura >= inicioSeptiembre &&
          fechaFactura <= finSeptiembre;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasSeptiembre.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_septiembre: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloOctubre() {
    const avancesPorCliente = new Map<string, number>();

    const facturasOctubre = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioOctubre = new Date('2025-10-01');
        const finOctubre = new Date('2025-10-31');

        return fechaFactura >= inicioOctubre &&
          fechaFactura <= finOctubre;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasOctubre.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_octubre: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloNoviembre() {
    const avancesPorCliente = new Map<string, number>();

    const facturasNoviembre = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioNoviembre = new Date('2025-11-01');
        const finNoviembre = new Date('2025-11-30');

        return fechaFactura >= inicioNoviembre &&
          fechaFactura <= finNoviembre;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasNoviembre.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_noviembre: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloDiciembre() {
    const avancesPorCliente = new Map<string, number>();

    const facturasDiciembre = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioDiciembre = new Date('2025-12-01');
        const finDiciembre = new Date('2025-12-31');

        return fechaFactura >= inicioDiciembre &&
          fechaFactura <= finDiciembre;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasDiciembre.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_diciembre: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloEnero() {
    const avancesPorCliente = new Map<string, number>();

    const facturasEnero = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioEnero = new Date('2026-01-01');
        const finEnero = new Date('2026-01-31');

        return fechaFactura >= inicioEnero &&
          fechaFactura <= finEnero;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasEnero.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_enero: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloFebrero() {
    const avancesPorCliente = new Map<string, number>();

    const facturasFebrero = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioFebrero = new Date('2026-02-01');
        const finFebrero = new Date('2026-02-28');

        return fechaFactura >= inicioFebrero &&
          fechaFactura <= finFebrero;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasFebrero.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_febrero: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloMarzo() {
    const avancesPorCliente = new Map<string, number>();

    const facturasMarzo = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioMarzo = new Date('2026-03-01');
        const finMarzo = new Date('2026-03-31');

        return fechaFactura >= inicioMarzo &&
          fechaFactura <= finMarzo;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasMarzo.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_marzo: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloAbril() {
    const avancesPorCliente = new Map<string, number>();

    const facturasAbril = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioAbril = new Date('2026-04-01');
        const finAbril = new Date('2026-04-30');

        return fechaFactura >= inicioAbril &&
          fechaFactura <= finAbril;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasAbril.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_abril: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloMayo() {
    const avancesPorCliente = new Map<string, number>();

    const facturasMayo = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioMayo = new Date('2026-05-01');
        const finMayo = new Date('2026-05-31');

        return fechaFactura >= inicioMayo &&
          fechaFactura <= finMayo;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasMayo.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_mayo: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  calcularAvanceGlobalSoloJunio() {
    const avancesPorCliente = new Map<string, number>();

    const facturasJunio = this.facturasOriginales.filter(factura => {
      try {
        const fechaFactura = new Date(factura.fecha_factura);
        const inicioJunio = new Date('2026-06-01');
        const finJunio = new Date('2026-06-30');

        return fechaFactura >= inicioJunio &&
          fechaFactura <= finJunio;
      } catch (e) {
        console.warn('Factura con fecha inválida:', factura);
        return false;
      }
    });

    // Sumar montos por cliente en lugar de contar facturas
    facturasJunio.forEach(factura => {
      const claveCliente = factura.contacto_referencia;
      const monto = parseFloat(factura.venta_total) || 0;

      const totalActual = avancesPorCliente.get(claveCliente) || 0;
      avancesPorCliente.set(claveCliente, totalActual + monto);
    });

    // Actualizar clientes
    this.clientesPaginados = this.clientesPaginados.map(cliente => {
      return {
        ...cliente,
        total_facturas_junio: avancesPorCliente.get(cliente.clave) || 0
      };
    });
  }

  formatCurrency(value: number): string {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}