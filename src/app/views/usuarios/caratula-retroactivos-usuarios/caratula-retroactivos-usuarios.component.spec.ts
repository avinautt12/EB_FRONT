import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaratulaRetroactivosUsuariosComponent } from './caratula-retroactivos-usuarios.component';

describe('CaratulaRetroactivosUsuariosComponent', () => {
  let component: CaratulaRetroactivosUsuariosComponent;
  let fixture: ComponentFixture<CaratulaRetroactivosUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaratulaRetroactivosUsuariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaratulaRetroactivosUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
