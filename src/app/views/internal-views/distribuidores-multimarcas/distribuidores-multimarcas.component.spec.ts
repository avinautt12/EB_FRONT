import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistribuidoresMultimarcasComponent } from './distribuidores-multimarcas.component';

describe('DistribuidoresMultimarcasComponent', () => {
  let component: DistribuidoresMultimarcasComponent;
  let fixture: ComponentFixture<DistribuidoresMultimarcasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DistribuidoresMultimarcasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DistribuidoresMultimarcasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
