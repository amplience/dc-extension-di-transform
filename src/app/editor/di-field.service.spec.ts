import { TestBed } from '@angular/core/testing';

import { DiFieldService } from './di-field.service';

describe('DiFieldService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DiFieldService = TestBed.get(DiFieldService);
    expect(service).toBeTruthy();
  });
});
