import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaratulaUsuariosComponent } from './caratula-usuarios.component';

describe('CaratulaUsuariosComponent', () => {
  let component: CaratulaUsuariosComponent;
  let fixture: ComponentFixture<CaratulaUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaratulaUsuariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaratulaUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
