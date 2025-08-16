import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaratulaGlobalComponent } from './caratula-global.component';

describe('CaratulaGlobalComponent', () => {
  let component: CaratulaGlobalComponent;
  let fixture: ComponentFixture<CaratulaGlobalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaratulaGlobalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaratulaGlobalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
