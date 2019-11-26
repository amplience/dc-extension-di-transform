import { TestBed } from '@angular/core/testing';

import { ImageTransformerService } from './image-transformer.service';

describe('ImageTransformerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ImageTransformerService = TestBed.get(ImageTransformerService);
    expect(service).toBeTruthy();
  });
});
