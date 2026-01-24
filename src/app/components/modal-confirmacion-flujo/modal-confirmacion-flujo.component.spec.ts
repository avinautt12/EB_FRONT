import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalConfirmacionFlujoComponent } from './modal-confirmacion-flujo.component';

describe('ModalConfirmacionFlujoComponent', () => {
  let component: ModalConfirmacionFlujoComponent;
  let fixture: ComponentFixture<ModalConfirmacionFlujoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalConfirmacionFlujoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalConfirmacionFlujoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
