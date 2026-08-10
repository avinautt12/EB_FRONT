import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudRetroactivoComponent } from './solicitud-retroactivo.component';

describe('SolicitudRetroactivoComponent', () => {
  let component: SolicitudRetroactivoComponent;
  let fixture: ComponentFixture<SolicitudRetroactivoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudRetroactivoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitudRetroactivoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should allow removing an attached file', () => {
    const archivo = new File(['contenido'], 'ticket.pdf', { type: 'application/pdf' });
    component.archivos['ticket_compra'] = archivo;

    component.removeArchivo('ticket_compra');

    expect(component.archivos['ticket_compra']).toBeUndefined();
  });

  it('should avoid NaN when a dashboard row has an empty monto_total', () => {
    const fila = { total_solicitudes: 2, monto_total: undefined } as any;

    expect(component.metricValue('producto', fila)).toBe(2);
    expect(component.formatearMetric('producto', component.metricValue('producto', fila))).toBe('$0');
  });
});
