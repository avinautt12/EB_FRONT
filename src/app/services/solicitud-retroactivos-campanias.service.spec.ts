import { TestBed } from '@angular/core/testing';

import { SolicitudRetroactivosCampaniasService } from './solicitud-retroactivo-campanias.service';

describe('SolicitudRetroactivosCampaniasService', () => {
  let service: SolicitudRetroactivosCampaniasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SolicitudRetroactivosCampaniasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
