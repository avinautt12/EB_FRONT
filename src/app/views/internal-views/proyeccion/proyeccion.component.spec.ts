import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProyeccionComponent } from './proyeccion.component';

describe('ProyeccionComponent', () => {
  let component: ProyeccionComponent;
  let fixture: ComponentFixture<ProyeccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProyeccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProyeccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
