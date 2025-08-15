import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaratulaEvacAComponent } from './caratula-evac-a.component';

describe('CaratulaEvacAComponent', () => {
  let component: CaratulaEvacAComponent;
  let fixture: ComponentFixture<CaratulaEvacAComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaratulaEvacAComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaratulaEvacAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
