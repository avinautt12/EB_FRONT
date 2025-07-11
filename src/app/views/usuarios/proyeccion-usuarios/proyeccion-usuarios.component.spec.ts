import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProyeccionUsuariosComponent } from './proyeccion-usuarios.component';

describe('ProyeccionUsuariosComponent', () => {
  let component: ProyeccionUsuariosComponent;
  let fixture: ComponentFixture<ProyeccionUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProyeccionUsuariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProyeccionUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
