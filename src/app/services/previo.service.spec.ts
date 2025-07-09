import { TestBed } from '@angular/core/testing';

import { PrevioService } from './previo.service';

describe('PrevioService', () => {
  let service: PrevioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrevioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
