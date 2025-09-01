import { TestBed } from '@angular/core/testing';

import { IntegralesService } from './integrales.service';

describe('IntegralesService', () => {
  let service: IntegralesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IntegralesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
