import { TestBed } from '@angular/core/testing';

import { MetasService } from './metas.service';

describe('MetasService', () => {
  let service: MetasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
