import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProyeccionHistorialComponent } from './proyeccion-historial.component';

describe('ProyeccionHistorialComponent', () => {
  let component: ProyeccionHistorialComponent;
  let fixture: ComponentFixture<ProyeccionHistorialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProyeccionHistorialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProyeccionHistorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
