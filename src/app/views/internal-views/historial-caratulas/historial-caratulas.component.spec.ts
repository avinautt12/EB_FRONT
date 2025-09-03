import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialCaratulasComponent } from './historial-caratulas.component';

describe('HistorialCaratulasComponent', () => {
  let component: HistorialCaratulasComponent;
  let fixture: ComponentFixture<HistorialCaratulasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialCaratulasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialCaratulasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
