import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FechaActualizacionComponent } from './fecha-actualizacion.component';

describe('FechaActualizacionComponent', () => {
  let component: FechaActualizacionComponent;
  let fixture: ComponentFixture<FechaActualizacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FechaActualizacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FechaActualizacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
