import { TestBed } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';

import { DiImageService } from './di-image.service';
import { DiFieldService } from './di-field.service';

describe('DiImageService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DiImageService = TestBed.get(DiImageService);
    expect(service).toBeTruthy();
  });
});

describe('DiImageService.updateDimensionMetadata', () => {
  let field: any;
  let service: DiImageService;

  beforeEach(() => {
    // Minimal fake field so we can test the logic without the full DI graph.
    field = { data: { crop: [0, 0, 0, 0] }, fieldUpdated: new EventEmitter(), isCropActive: () => false };
    service = new DiImageService(field as DiFieldService, {} as any);
    service.imageWidth = 800;
    service.imageHeight = 600;
  });

  it('writes the source dimensions and ratio when uncropped', () => {
    expect(service.updateDimensionMetadata()).toBe(true);
    expect(field.data.width).toBe(800);
    expect(field.data.height).toBe(600);
    expect(field.data.aspectRatio).toBe(1.3333); // 800/600, rounded to 4dp
  });

  it('uses the crop rectangle dimensions when a crop is active', () => {
    field.isCropActive = () => true;
    field.data.crop = [0, 0, 100, 200];
    service.updateDimensionMetadata();
    expect(field.data.width).toBe(100);
    expect(field.data.height).toBe(200);
    expect(field.data.aspectRatio).toBe(0.5); // crop width/height
  });

  it('returns false when nothing changed', () => {
    service.updateDimensionMetadata();
    expect(service.updateDimensionMetadata()).toBe(false);
  });
});
