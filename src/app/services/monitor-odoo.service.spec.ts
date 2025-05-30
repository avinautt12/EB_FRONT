import { TestBed } from '@angular/core/testing';

import { MonitorOdooService } from './monitor-odoo.service';

describe('MonitorOdooService', () => {
  let service: MonitorOdooService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MonitorOdooService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
