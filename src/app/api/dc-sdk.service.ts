import { Injectable, EventEmitter } from '@angular/core';
import { SDK } from 'dc-extensions-sdk';

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
      this.sdk = (window as any).extensionsSdkInstance as Promise<SDK>;
    }
    return await this.sdk;
  }
}
