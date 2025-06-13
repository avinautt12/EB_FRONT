import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnviarCorreoComponent } from './enviar-correo.component';

describe('EnviarCorreoComponent', () => {
  let component: EnviarCorreoComponent;
  let fixture: ComponentFixture<EnviarCorreoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnviarCorreoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnviarCorreoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
