import { TestBed } from '@angular/core/testing';

import { RetroactivosService } from './retroactivos.service';

describe('RetroactivosService', () => {
  let service: RetroactivosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RetroactivosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
