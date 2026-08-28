import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudRetroactivoCampaniasComponent } from './solicitud-retroactivo-campanias.component';

describe('SolicitudRetroactivoCampaniasComponent', () => {
  let component: SolicitudRetroactivoCampaniasComponent;
  let fixture: ComponentFixture<SolicitudRetroactivoCampaniasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudRetroactivoCampaniasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitudRetroactivoCampaniasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
