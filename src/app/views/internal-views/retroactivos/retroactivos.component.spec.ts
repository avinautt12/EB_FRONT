import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetroactivosComponent } from './retroactivos.component';

describe('RetroactivosComponent', () => {
  let component: RetroactivosComponent;
  let fixture: ComponentFixture<RetroactivosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetroactivosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RetroactivosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
