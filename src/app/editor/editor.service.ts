import { Injectable, EventEmitter } from '@angular/core';
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
  private cancelBackup: DiTransformedImage;

  modeChange: EventEmitter<PreviewMode> = new EventEmitter();

  constructor(private field: DiFieldService, private sdkService: DcSdkService, private image: DiImageService) { }

  modeRequest(mode: string) {
    const needBackup = this.previewMode === PreviewMode.View;
    switch (mode) {
      case 'view':
        this.previewMode = PreviewMode.View;
        break;
      case 'swap':
        this.switchImage();
        break;
      case 'edit':
        this.previewMode = PreviewMode.EditCrop;
        if (needBackup) {
          this.backup();
        }
        break;
      case 'poi':
        this.previewMode = PreviewMode.POI;
        if (needBackup) {
          this.backup();
        }
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
    const image = this.field.data.image;
    this.field.data = this.cancelBackup;
    this.field.data.image = image;
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
    this.field.data.poi = {x: -1, y: -1};
    this.field.data.crop = [null, null, null, null];
    this.field.updateField();
    this.image.loadImage(this.field.data);
    this.image.parseDataChange(this.field.data);
    await this.field.updateField();
    this.modeRequest('edit');
  }

  setMode(mode: PreviewMode) {
    this.previewMode = mode;
    this.modeChange.emit(this.previewMode);
  }
}
