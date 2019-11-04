import { Injectable, EventEmitter } from '@angular/core';
import { DiEditMode } from './di-edit-slider';
import { DiFieldService } from './di-field.service';
import { DcSdkService } from '../api/dc-sdk.service';
import { DiImageService } from './di-image.service';
import { DiTransformedImage } from '../model/di-transformed-image';
import { MediaImageLink } from 'dc-extensions-sdk';

export enum PreviewMode {
  View,

  EditCrop,
  EditRotate,
  EditHSV,
  EditFlip,
  EditScale,

  POI
}

@Injectable({
  providedIn: 'root'
})
export class EditorService {
  previewMode: PreviewMode = PreviewMode.View;
  mode: DiEditMode = 'crop';

  private cancelBackup: DiTransformedImage;

  modeChange: EventEmitter<PreviewMode> = new EventEmitter();

  constructor(private field: DiFieldService, private sdkService: DcSdkService, private image: DiImageService) { }

  modeRequest(mode: string) {
    switch (mode) {
      case 'view':
        this.previewMode = PreviewMode.View;
        break;
      case 'swap':
        this.switchImage();
        break;
      case 'edit':
        this.previewMode = PreviewMode.EditCrop;
        this.backup();
        this.mode = 'crop';
        break;
      case 'poi':
        this.previewMode = PreviewMode.POI;
        this.backup();
        this.mode = 'poi';
        break;
      case 'delete':
        this.field.data.image = null;
        this.previewMode = PreviewMode.View;
        this.field.updateField();
        break;
    }

    this.modeChange.emit(this.previewMode);
  }

  backup() {
    // todo: better deep copy?
    this.cancelBackup = JSON.parse(JSON.stringify(this.field.data));
  }

  cancelChanges() {
    this.field.data = this.cancelBackup;
    this.field.updateField();
  }

  async switchImage() {
    const sdk = await this.sdkService.getSDK();
    let result: MediaImageLink;
    try {
      result = await sdk.mediaLink.getImage();
    } catch (err) {
      return;
    }
    this.field.data.image = result;
    this.field.data.poi = {x: 0.5, y: 0.5};
    this.field.data.crop = [null, null, null, null];
    this.image.loadImage(this.field.data);
    this.image.parseDataChange(this.field.data);
    await this.field.updateField();
    this.modeRequest('edit');
  }
}
