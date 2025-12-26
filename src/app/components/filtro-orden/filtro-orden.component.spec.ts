import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltroOrdenComponent } from './filtro-orden.component';

describe('FiltroOrdenComponent', () => {
  let component: FiltroOrdenComponent;
  let fixture: ComponentFixture<FiltroOrdenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltroOrdenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FiltroOrdenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
