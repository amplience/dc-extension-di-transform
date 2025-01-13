import { Injectable } from '@angular/core';
import { init, ContentFieldExtension, Params } from 'dc-extensions-sdk';
import { DiTransformedImage } from '../model/di-transformed-image';

export interface Parameters extends Params {
  installation: {
    imageStudioDomain: string;
    mediaAssetsUrl: string;
  };
}

/** A simple wrapper around the dc-extensions-sdk */
@Injectable({
  providedIn: 'root'
})
export class DcSdkService {
  private sdk: ContentFieldExtension<DiTransformedImage, Parameters>;
  constructor() {
  }

  public async getSDK() {
    if (!this.sdk) {
      this.sdk = await init<ContentFieldExtension<DiTransformedImage, Parameters>>();
    }
    return this.sdk;
  }
}
