import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopBarUsuariosComponent } from './top-bar-usuarios.component';

describe('TopBarUsuariosComponent', () => {
  let component: TopBarUsuariosComponent;
  let fixture: ComponentFixture<TopBarUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopBarUsuariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopBarUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
