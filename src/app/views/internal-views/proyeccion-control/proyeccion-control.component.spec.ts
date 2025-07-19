import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProyeccionControlComponent } from './proyeccion-control.component';

describe('ProyeccionControlComponent', () => {
  let component: ProyeccionControlComponent;
  let fixture: ComponentFixture<ProyeccionControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProyeccionControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProyeccionControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
