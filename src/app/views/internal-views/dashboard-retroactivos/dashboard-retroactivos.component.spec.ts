import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardRetroactivosComponent } from './dashboard-retroactivos.component';

describe('DashboardRetroactivosComponent', () => {
  let component: DashboardRetroactivosComponent;
  let fixture: ComponentFixture<DashboardRetroactivosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRetroactivosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardRetroactivosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
