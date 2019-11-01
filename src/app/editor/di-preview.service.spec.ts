import { TestBed } from '@angular/core/testing';

import { DiPreviewService } from './di-preview.service';

describe('DiPreviewService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DiPreviewService = TestBed.get(DiPreviewService);
    expect(service).toBeTruthy();
  });
});
