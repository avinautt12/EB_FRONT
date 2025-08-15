import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaratulaEvacBComponent } from './caratula-evac-b.component';

describe('CaratulaEvacBComponent', () => {
  let component: CaratulaEvacBComponent;
  let fixture: ComponentFixture<CaratulaEvacBComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaratulaEvacBComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaratulaEvacBComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
