import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturasClienteComponent } from './facturas-cliente.component';

describe('FacturasClienteComponent', () => {
  let component: FacturasClienteComponent;
  let fixture: ComponentFixture<FacturasClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturasClienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturasClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
