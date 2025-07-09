import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaratulasComponent } from './caratulas.component';

describe('CaratulasComponent', () => {
  let component: CaratulasComponent;
  let fixture: ComponentFixture<CaratulasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaratulasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaratulasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
