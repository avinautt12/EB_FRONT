import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProyeccionDetallesComponent } from './proyeccion-detalles.component';

describe('ProyeccionDetallesComponent', () => {
  let component: ProyeccionDetallesComponent;
  let fixture: ComponentFixture<ProyeccionDetallesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProyeccionDetallesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProyeccionDetallesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
