import { Injectable, EventEmitter } from '@angular/core';
import { DiTransformedImage } from '../model/di-transformed-image';
import { DIEditSlider } from './di-edit-slider';
import { DcSdkService } from '../api/dc-sdk.service';

@Injectable({
  providedIn: 'root'
})
export class DiFieldService {

  fieldUpdated: EventEmitter<DiTransformedImage> = new EventEmitter();
  data: DiTransformedImage;

  constructor(private sdk: DcSdkService) {
    sdk.getSDK().then(async (sdkInstance) => {
      this.data = await sdkInstance.field.getValue();
      this.parseData();
      this.updateField();
    });
  }

  async updateField() {
    this.fieldUpdated.emit(this.data);
    const sdk = await this.sdk.getSDK();
    sdk.field.setValue(this.data);
  }

  async parseData() {
    if (this.data == null) {
      // initialize the data with an empty object
      this.data = {
        crop: [0, 0, 1, 1],
        rot: 0,
        hue: 0,
        sat: 0,
        bri: 0,
        poi: null,
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

  updateSliderValue(slider: DIEditSlider, value: number) {
    if (this.data == null) {
      return;
    }
    this.data[slider.field] = value;
    this.updateField();
  }

  getSliderValue(slider: DIEditSlider): number {
    if (this.data == null) {
      return 0;
    }
    const value = this.data[slider.field];
    return (value == null) ? 0 : value;
  }
}
