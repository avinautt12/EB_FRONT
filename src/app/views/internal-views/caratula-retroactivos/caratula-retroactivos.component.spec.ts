import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaratulaRetroactivosComponent } from './caratula-retroactivos.component';

describe('CaratulaRetroactivosComponent', () => {
  let component: CaratulaRetroactivosComponent;
  let fixture: ComponentFixture<CaratulaRetroactivosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaratulaRetroactivosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaratulaRetroactivosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
