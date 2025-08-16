import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CaratulasService } from '../../../services/caratulas.service';
import { HomeBarComponent } from "../../../components/home-bar/home-bar.component";
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-caratula-evac-a',
  imports: [CommonModule, RouterModule, HomeBarComponent],
  templateUrl: './caratula-evac-a.component.html',
  styleUrl: './caratula-evac-a.component.css'
})
export class CaratulaEvacAComponent implements OnInit {

  meta = ''
  clientes: any[] = [];
  loading = false;
  error: string | null = null;

  my25_monto1 = 0;
  my25_monto2 = 0;
  my25_monto3 = 0;
  my25_monto4 = 0;
  avance_proyectado_monto1 = 0;
  avance_proyectado_monto2 = 0;

  constructor(private caratulasService: CaratulasService, private router: Router) { }

  ngOnInit(): void {
    this.cargarClientes();
    this.calcularMontos();
  }

  cargarClientes(): void {
    this.loading = true;
    this.error = null;

    this.caratulasService.getClientesEvacA().subscribe({
      next: (data) => {
        this.clientes = data;
        this.calcularMontos();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los clientes';
        this.loading = false;
        console.error('Error:', error);
      }
    });
  }

  obtenerSemanaISO(fecha: Date = new Date()): number {
    const date = new Date(fecha.getTime());
    date.setHours(0, 0, 0, 0);

    // Jueves de la semana actual
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);

    // Enero 4 siempre está en la semana 1
    const week1 = new Date(date.getFullYear(), 0, 4);

    // Calcular el número de semana
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  obtenerSemanasTranscurridas(): number {
    const semanaActual = this.obtenerSemanaISO();
    const semanaInicioTemporada = 26;

    if (semanaActual < semanaInicioTemporada) {
      return (52 - semanaInicioTemporada) + semanaActual;
    }

    return semanaActual - semanaInicioTemporada;
  }

  calcularAvanceProyectadoMonto1(): void {
    if (this.my25_monto1 === 0) return;

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    this.avance_proyectado_monto1 = (semanasTranscurridas / semanasEnTemporada) * this.my25_monto1;

    this.avance_proyectado_monto1 = Math.round(this.avance_proyectado_monto1 * 100) / 100;
  }

  calcularAvanceProyectadoMonto2(): void {
    if (this.my25_monto2 === 0) return;

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    this.avance_proyectado_monto2 = (semanasTranscurridas / semanasEnTemporada) * this.my25_monto2;

    this.avance_proyectado_monto2 = Math.round(this.avance_proyectado_monto2 * 100) / 100;
  }

  recargarClientes(): void {
    this.cargarClientes();
  }

  calcularMontos(): void {
    this.calcularMonto1();
    this.calcularMonto2();
    this.calcularMonto3();
    this.calcularMonto4();
    this.calcularAvanceProyectadoMonto1();
    this.calcularAvanceProyectadoMonto2();
    this.obtenerMetaTotal();
    this.obtenerAcumuladoTotal();
    this.calcularAvanceProyectadoTotal();
    this.calcularPorcentajeEB();
  }

  // Método para calcular monto1 (Partner, Partner Elite, Partner Elite Plus)
  calcularMonto1(): void {
    this.my25_monto1 = 0;
    const nivelesPermitidos = ['Partner', 'Partner Elite', 'Partner Elite Plus'];

    this.clientes.forEach(cliente => {
      const compraMinima = cliente.compra_minima_anual || 0;

      if (nivelesPermitidos.includes(cliente.nivel)) {
        this.my25_monto1 += compraMinima;
      }
    });

    // Redondear a 2 decimales
    this.my25_monto1 = Math.round(this.my25_monto1 * 100) / 100;
  }

  // Método para calcular monto2 (solo Distribuidor)
  calcularMonto2(): void {
    this.my25_monto2 = 0;

    this.clientes.forEach(cliente => {
      const compraMinima = cliente.compra_minima_anual || 0;

      if (cliente.nivel === 'Distribuidor') {
        this.my25_monto2 += compraMinima;
      }
    });

    // Redondear a 2 decimales
    this.my25_monto2 = Math.round(this.my25_monto2 * 100) / 100;
  }

  calcularMonto3(): void {
    this.my25_monto3 = 0;
    const nivelesPermitidos = ['Partner', 'Partner Elite', 'Partner Elite Plus'];

    this.clientes.forEach(cliente => {
      const compraAcumulado = cliente.acumulado_anticipado || 0;

      if (nivelesPermitidos.includes(cliente.nivel)) {
        this.my25_monto3 += compraAcumulado;
      }
    });

    // Redondear a 2 decimales
    this.my25_monto3 = Math.round(this.my25_monto3 * 100) / 100;
  }

  // Método para calcular monto2 (solo Distribuidor)
  calcularMonto4(): void {
    this.my25_monto4 = 0;

    this.clientes.forEach(cliente => {
      const compraAcumulado = cliente.acumulado_anticipado || 0;

      if (cliente.nivel === 'Distribuidor') {
        this.my25_monto4 += compraAcumulado;
      }
    });

    // Redondear a 2 decimales
    this.my25_monto4 = Math.round(this.my25_monto4 * 100) / 100;
  }

  calcularAvanceProyectadoTotal(): void {
    const metaTotal = this.my25_monto1 + this.my25_monto2;

    if (metaTotal === 0) return;

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    // Calcular el avance proyectado total
    const avanceProyectadoTotal = (semanasTranscurridas / semanasEnTemporada) * metaTotal;

    // Redondear a 2 decimales
    const avanceProyectadoTotalRedondeado = Math.round(avanceProyectadoTotal * 100) / 100;

    // Ahora distribuir proporcionalmente entre monto1 y monto2
    if (metaTotal > 0) {
      const proporcionMonto1 = this.my25_monto1 / metaTotal;
      const proporcionMonto2 = this.my25_monto2 / metaTotal;

      this.avance_proyectado_monto1 = Math.round((avanceProyectadoTotalRedondeado * proporcionMonto1) * 100) / 100;
      this.avance_proyectado_monto2 = Math.round((avanceProyectadoTotalRedondeado * proporcionMonto2) * 100) / 100;
    }
  }

  obtenerAvanceProyectadoTotalFormateado(): string {
    const metaTotal = this.my25_monto1 + this.my25_monto2;

    if (metaTotal === 0) return this.formatearMoneda(0);

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    const avanceProyectadoTotal = (semanasTranscurridas / semanasEnTemporada) * metaTotal;
    const avanceProyectadoTotalRedondeado = Math.round(avanceProyectadoTotal * 100) / 100;

    return this.formatearMoneda(avanceProyectadoTotalRedondeado);
  }

  calcularPorcentajeEB(): string {
    const acumuladoStr = this.obtenerAcumuladoTotal();
    const proyectadoStr = this.obtenerAvanceProyectadoTotalFormateado();

    // Extraer números de los strings formateados (quitar $ y ,)
    const acumulado = parseFloat(acumuladoStr.replace(/[$,]/g, ''));
    const proyectado = parseFloat(proyectadoStr.replace(/[$,]/g, ''));

    if (proyectado === 0) return "0%";

    const resultado = (acumulado / proyectado) - 1;
    const porcentaje = Math.round(resultado * 100);

    return `${porcentaje}%`;
  }

  calcularPorcentajeMonto1(): string {
    const acumuladoStr = this.calcularMonto1();
    const proyectadoStr = this.calcularMonto3();

    // Extraer números de los strings formateados (quitar $ y ,)
    const acumulado = this.my25_monto3;
    const proyectado = this.avance_proyectado_monto1;

    if (proyectado === 0) return "0%";

    const resultado = (acumulado / proyectado) - 1;
    const porcentaje = Math.round(resultado * 100);

    return `${porcentaje}%`;
  }

  // Función para calcular porcentaje de monto2
  calcularPorcentajeMonto2(): string {
    const acumuladoStr = this.calcularMonto2();
    const proyectadoStr = this.calcularMonto4();

    // Extraer números de los strings formateados (quitar $ y ,)
    const acumulado = this.my25_monto4;
    const proyectado = this.avance_proyectado_monto2;

    if (proyectado === 0) return "0%";

    const resultado = (acumulado / proyectado) - 1;
    const porcentaje = Math.round(resultado * 100);

    return `${porcentaje}%`;
  }

  obtenerFechaHoy(): string {
    const hoy = new Date();
    return hoy.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Función para obtener el día de la temporada (semana ISO - 26)
  obtenerDiaTemporada(): number {
    const semanaISO = this.obtenerSemanaISO();
    return semanaISO - 26;
  }

  calcularYFormatearAvanceProyectado(metaValor: number): string {
    if (metaValor === 0) return this.formatearMoneda(0);

    const semanasTranscurridas = this.obtenerSemanasTranscurridas();
    const semanasEnTemporada = 52;

    const avanceProyectado = (semanasTranscurridas / semanasEnTemporada) * metaValor;
    const avanceProyectadoRedondeado = Math.round(avanceProyectado * 100) / 100;

    return this.formatearMoneda(avanceProyectadoRedondeado);
  }


  obtenerMetaTotal(): string {
    return this.formatearMoneda(this.my25_monto1 + this.my25_monto2);
  }

  obtenerAcumuladoTotal(): string {
    return this.formatearMoneda(this.my25_monto3 + this.my25_monto4);
  }

  formatearMoneda(valor: number): string {
    if (valor === null || valor === undefined || isNaN(valor)) {
      return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valor);
  }
}