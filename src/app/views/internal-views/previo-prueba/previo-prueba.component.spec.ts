import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrevioPruebaComponent } from './previo-prueba.component';

describe('PrevioPruebaComponent', () => {
  let component: PrevioPruebaComponent;
  let fixture: ComponentFixture<PrevioPruebaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrevioPruebaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrevioPruebaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
