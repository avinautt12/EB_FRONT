import { TestBed } from '@angular/core/testing';

import { MultimarcasService } from './multimarcas.service';

describe('MultimarcasService', () => {
  let service: MultimarcasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MultimarcasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
