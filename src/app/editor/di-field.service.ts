import { Injectable, EventEmitter, DefaultIterableDiffer } from '@angular/core';
import { DiTransformedImage } from '../model/di-transformed-image';
import { DiEditSlider } from './di-edit-slider';
import { DcSdkService } from '../api/dc-sdk.service';
import { throwMatDialogContentAlreadyAttachedError } from '@angular/material';
import { normalizePassiveListenerOptions } from '@angular/cdk/platform';

@Injectable({
  providedIn: 'root'
})
export class DiFieldService {

  fieldUpdated: EventEmitter<DiTransformedImage> = new EventEmitter();
  data: DiTransformedImage;
  stagingEnvironment: string;
  defaultParams: string[] = [];
  fullRes: boolean;

  private updateInProgress: boolean;

  constructor(private sdk: DcSdkService) {
    sdk.getSDK().then(async (sdkInstance) => {
      sdkInstance.frame.startAutoResizer();
      this.stagingEnvironment = sdkInstance.stagingEnvironment;
      this.loadParams(sdkInstance.params.instance);
      this.data = await sdkInstance.field.getValue();
      this.parseData();
      this.updateField();
    });
  }

  private loadParams(params: any) {
    if (params.customVSE) {
      this.stagingEnvironment = params.customVSE;
    }
    if (!params.useVSE) {
      this.stagingEnvironment = null;
    }
    this.fullRes = params.alwaysFullRes;
  }

  async updateField() {
    if (this.updateInProgress) {
      return;
    }
    this.updateInProgress = true;
    this.fieldUpdated.emit(this.data);
    const sdk = await this.sdk.getSDK();
    sdk.field.setValue(this.data);
    this.updateInProgress = false;
  }

  getImageHost(): string {
    return this.stagingEnvironment || ((this.data && this.data.image) ? this.data.image.defaultHost : null);
  }

  parseData() {
    if (this.data == null) {
      // initialize the data with an empty object
      this.data = {
        crop: [0, 0, 0, 0],
        rot: 0,
        hue: 0,
        sat: 0,
        bri: 0,
        fliph: false,
        flipv: false,
        poi: {x: -1, y: -1},
        aspectLock: 'none',
        query: ''
      };
    }
    if (this.data.image != null && this.data.image._meta == null) {
      // image is uninitialized.
      this.data.image = null;
    }
    if (this.data.poi != null && this.data.poi.x == null) {
      // poi is uninitialized.
      this.data.poi = null;
    }
  }

  isCropActive() {
    return this.data.crop != null && this.data.crop[0] != null && this.data.crop[2] !== 0 && this.data.crop[3] !== 0;
  }

  isPOIActive() {
    return this.data.poi != null && this.data.poi.x !== -1 && this.data.poi.y !== -1;
  }

  isImageActive() {
    return this.data != null && this.data.image != null && this.data.image.name != null;
  }

  updateSliderValue(slider: DiEditSlider, value: number) {
    if (this.data == null) {
      return;
    }
    this.data[slider.field] = value;
    this.updateField();
  }

  getSliderValue(slider: DiEditSlider): number {
    if (this.data == null) {
      return 0;
    }
    const value = this.data[slider.field];
    return (value == null) ? 0 : value;
  }

  resetDefault() {
    const image = this.data.image;
    this.data = null;
    this.parseData();
    this.data.image = image;
    this.updateField();
  }
}
