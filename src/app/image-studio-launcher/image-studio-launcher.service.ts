import { Injectable } from '@angular/core';
import { DcSdkService } from '../api/dc-sdk.service';
import { BehaviorSubject } from 'rxjs';
import { ImageInfo } from '../model/image-info';
import { UploadImageService } from './upload-image.service';
import { Asset } from '../model/asset';
import { DiFieldService } from '../editor/di-field.service';

export interface WindowData {
  window: Window;
  connected: boolean;
  srcImageUrl: string;
  sendMessage?: {
    extensionMeta?: boolean;
    srcImageUrl?: boolean;
  };
}

export interface WindowMessageDataOut {
  extensionMeta?: {
    exportContext: string;
  };
  inputImageUrl?: string;
  focus?: boolean;
}

export interface WindowMessageDataIn {
  data: {
    exportImageUrl?: string;
    connect?: boolean;
    disconnect?: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ImageStudioLauncherService {
  private readonly _activeWindow = new BehaviorSubject<WindowData>(undefined);
  readonly _activeWindow$ = this._activeWindow.asObservable();

  private readonly _returnedImageUrl = new BehaviorSubject<string>(undefined);
  readonly _returnedImageUrl$ = this._returnedImageUrl.asObservable();

  imageInfo: ImageInfo;
  imageStudioUrl: string;

  constructor(private sdkService: DcSdkService, private uploadImageService: UploadImageService, private diFieldService: DiFieldService) {

    window.addEventListener('message', (event) => this.listener(event));

    this._activeWindow.subscribe(() => {
      this.sendWindowMessages(this.activeWindow);
    });

    this._returnedImageUrl.subscribe((value) => {
      if (!value) {
        return;
      }
      this.uploadImageService.uploadToAssetStore(this.returnedImageUrl, this.imageInfo).then((uploadedAsset: Asset) => {
        const mediaImageLink = this.uploadImageService.createImageLinkFromAsset(this.imageInfo.srcImage, uploadedAsset);
        this.diFieldService.updateImageValue(mediaImageLink);
      });
    });
  }

  get activeWindow(): WindowData {
    return this._activeWindow.getValue();
  }

  set activeWindow(value: WindowData) {
    this._activeWindow.next(value);
  }

  get returnedImageUrl(): string {
    return this._returnedImageUrl.getValue();
  }

  set returnedImageUrl(value: string) {
    this._returnedImageUrl.next(value);
  }

  async sendWindowMessages(windowData: WindowData) {
    if (windowData && windowData.connected && windowData.sendMessage) {
      // process sending messages
      const messageData: WindowMessageDataOut = {};
      if (windowData.sendMessage.extensionMeta) {
        messageData.extensionMeta = {
          exportContext: 'Content Item',
        };
      }

      if (windowData.sendMessage.srcImageUrl) {
        messageData.inputImageUrl = windowData.srcImageUrl;
        messageData.focus = true;
      }

      windowData.window.postMessage(messageData, this.imageStudioUrl);
      delete windowData.sendMessage; // clear all send flags so we don't do this again
    }
  }

  async listener(event: WindowMessageDataIn) {
    if (!event.data) {
      return;
    }
    if (event.data.exportImageUrl) {
      this.returnedImageUrl = event.data.exportImageUrl;
    }

    /**
     * On connecting or disconnecting, update our data model
     * Note: windows may temporarily disconnect, ie if they are refreshed
     * so we need to maintain historical data incase they reconnect
     */

    if (event.data.connect || event.data.disconnect) {
      const updatedWindow = { ...this.activeWindow };
      if (this.activeWindow) {
        if (event.data.connect && updatedWindow.connected === false) {
          updatedWindow.connected = true;

          // Once connected, send the metadata and srcUrl messages
          updatedWindow.sendMessage = {
            extensionMeta: true,
            srcImageUrl: true,
          };
        } else if (
          event.data.disconnect &&
          updatedWindow.connected === true
        ) {
          updatedWindow.connected = false;
        }
      }
      this.activeWindow = updatedWindow;
    }
  }

  public async openImageStudio(image) {
    const sdkInstance = await this.sdkService.getSDK();
    const srcAsset = await sdkInstance.assets.getById(image.id);

    this.imageInfo = {srcAsset, srcImage: image };
    this.imageStudioUrl = sdkInstance.params.installation.imageStudioUrl;

    if (this.activeWindow && this.activeWindow.connected) {
      this.activeWindow.srcImageUrl = this.imageInfo.srcAsset.thumbURL;
      this.activeWindow.sendMessage = {
        srcImageUrl: true,
      };
      this.sendWindowMessages(this.activeWindow);
      return;
    }

    // When no active, connected window, create another session
    const winRef = window.open(this.imageStudioUrl);
    if (winRef) {
      /**
       * Open a new window, but refrain from sending any meta/url until we are connected
       */
      const newWinObj: WindowData = {
        window: winRef,
        connected: false,
        srcImageUrl: this.imageInfo.srcAsset.thumbURL,
      };
      this.activeWindow = newWinObj;
    }
  }
}
