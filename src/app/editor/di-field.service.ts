import { Injectable, EventEmitter } from '@angular/core';
import { DiTransformedImage } from '../model/di-transformed-image';
import { DiEditSlider } from './di-edit-slider';
import { DcSdkService } from '../api/dc-sdk.service';

@Injectable({
  providedIn: 'root'
})
export class DiFieldService {

  fieldUpdated: EventEmitter<DiTransformedImage> = new EventEmitter();
  data: DiTransformedImage;

  private updateInProgress: boolean;

  constructor(private sdk: DcSdkService) {
    sdk.getSDK().then(async (sdkInstance) => {
      this.data = await sdkInstance.field.getValue();
      this.parseData();
      this.updateField();
    });
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
        poi: {x: 0.5, y: 0.5},
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
