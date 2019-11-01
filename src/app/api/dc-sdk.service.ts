import { Injectable, EventEmitter } from '@angular/core';
import { init, SDK } from 'dc-extensions-sdk';

/** A simple wrapper around the dc-extensions-sdk */
@Injectable({
  providedIn: 'root'
})
export class DcSdkService {
  private sdk: Promise<SDK>;
  constructor() {
  }

  public async getSDK(): Promise<SDK> {
    if (this.sdk == null) {
      this.sdk = init();
    }
    return await this.sdk;
  }
}
