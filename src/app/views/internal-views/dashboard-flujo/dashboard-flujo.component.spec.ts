import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardFlujoComponent } from './dashboard-flujo.component';

describe('DashboardFlujoComponent', () => {
  let component: DashboardFlujoComponent;
  let fixture: ComponentFixture<DashboardFlujoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardFlujoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardFlujoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
