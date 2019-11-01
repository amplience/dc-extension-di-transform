import { TestBed } from '@angular/core/testing';

import { DcSdkService } from './dc-sdk.service';

describe('DcSdkService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DcSdkService = TestBed.get(DcSdkService);
    expect(service).toBeTruthy();
  });
});
