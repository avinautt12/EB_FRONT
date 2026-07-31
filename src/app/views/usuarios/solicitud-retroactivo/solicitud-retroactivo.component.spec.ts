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
});
