import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductoCatalogoModalComponent } from './producto-catalogo-modal.component';

describe('ProductoCatalogoModalComponent', () => {
  let component: ProductoCatalogoModalComponent;
  let fixture: ComponentFixture<ProductoCatalogoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoCatalogoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductoCatalogoModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
