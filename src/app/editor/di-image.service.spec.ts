import { TestBed } from '@angular/core/testing';

import { DiImageService } from './di-image.service';

describe('DiImageService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DiImageService = TestBed.get(DiImageService);
    expect(service).toBeTruthy();
  });
});
