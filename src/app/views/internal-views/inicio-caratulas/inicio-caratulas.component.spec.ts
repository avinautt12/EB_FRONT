import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioCaratulasComponent } from './inicio-caratulas.component';

describe('InicioCaratulasComponent', () => {
  let component: InicioCaratulasComponent;
  let fixture: ComponentFixture<InicioCaratulasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioCaratulasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InicioCaratulasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
