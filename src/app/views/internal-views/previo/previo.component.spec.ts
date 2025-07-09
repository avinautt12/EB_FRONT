import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrevioComponent } from './previo.component';

describe('PrevioComponent', () => {
  let component: PrevioComponent;
  let fixture: ComponentFixture<PrevioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrevioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrevioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
