import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GastosOperativosComponent } from './gastos-operativos.component';

describe('GastosOperativosComponent', () => {
  let component: GastosOperativosComponent;
  let fixture: ComponentFixture<GastosOperativosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GastosOperativosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GastosOperativosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
