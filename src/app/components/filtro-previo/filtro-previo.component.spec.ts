import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltroPrevioComponent } from './filtro-previo.component';

describe('FiltroPrevioComponent', () => {
  let component: FiltroPrevioComponent;
  let fixture: ComponentFixture<FiltroPrevioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltroPrevioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FiltroPrevioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
