import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoguardadoDialogComponent } from './autoguardado-dialog.component';

describe('AutoguardadoDialogComponent', () => {
  let component: AutoguardadoDialogComponent;
  let fixture: ComponentFixture<AutoguardadoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoguardadoDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutoguardadoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
