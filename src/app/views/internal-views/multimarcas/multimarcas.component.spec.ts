import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultimarcasComponent } from './multimarcas.component';

describe('MultimarcasComponent', () => {
  let component: MultimarcasComponent;
  let fixture: ComponentFixture<MultimarcasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultimarcasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultimarcasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
