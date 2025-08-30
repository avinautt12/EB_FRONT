import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaratulaEvacsComponent } from './caratula-evacs.component';

describe('CaratulaEvacsComponent', () => {
  let component: CaratulaEvacsComponent;
  let fixture: ComponentFixture<CaratulaEvacsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaratulaEvacsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaratulaEvacsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
