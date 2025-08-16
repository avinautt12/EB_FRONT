import { TestBed } from '@angular/core/testing';

import { CaratulasService } from './caratulas.service';

describe('CaratulasService', () => {
  let service: CaratulasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CaratulasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
