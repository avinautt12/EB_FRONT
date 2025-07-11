import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearProyeccionUsuariosComponent } from './crear-proyeccion-usuarios.component';

describe('CrearProyeccionUsuariosComponent', () => {
  let component: CrearProyeccionUsuariosComponent;
  let fixture: ComponentFixture<CrearProyeccionUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearProyeccionUsuariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearProyeccionUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
