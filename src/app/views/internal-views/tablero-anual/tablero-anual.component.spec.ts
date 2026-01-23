import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableroAnualComponent } from './tablero-anual.component';

describe('TableroAnualComponent', () => {
  let component: TableroAnualComponent;
  let fixture: ComponentFixture<TableroAnualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableroAnualComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableroAnualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
