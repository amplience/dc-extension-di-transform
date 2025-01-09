import { Injectable } from '@angular/core';
import { DcSdkService } from '../api/dc-sdk.service';
import { AmplienceImageStudio } from '@amplience/image-studio-sdk/dist/esm';
import {
  ImageSaveEventData,
  ImageStudioEventType,
  SDKEventType,
} from '@amplience/image-studio-sdk';
import { MediaImageLink } from 'dc-extensions-sdk/dist/types/lib/components/MediaLink';
import { DiFieldService } from '../editor/di-field.service';
import { AssetLibraryService } from './asset-library.service';
import { Asset } from './types/Asset';

@Injectable({
  providedIn: 'root',
})
export class ImageStudioService {
  constructor(
    private sdkService: DcSdkService,
    private assetLibraryService: AssetLibraryService,
    private diFieldService: DiFieldService
  ) {}

  private async handleOnSaveCallback(
    data: any,
    srcImage: Asset,
    image: MediaImageLink
  ) {
    try {
      const imageData = data as ImageSaveEventData;
      if (imageData.image) {
        const uploadedAsset = await this.assetLibraryService.uploadAsset(
          imageData.image,
          srcImage
        );
        const imageLink = this.assetLibraryService.createImageLinkFromAsset(
          image,
          uploadedAsset
        );

        this.diFieldService.updateImageValue(imageLink);
        return SDKEventType.Success;
      }
      return SDKEventType.Fail;
    } catch (error) {
      console.error(error);
      return SDKEventType.Fail;
    }
  }

  public async openImageStudio(image) {
    try {
      const sdkInstance = await this.sdkService.getSDK();
      const imageStudioUrl =
        sdkInstance.params.installation.imageStudioUrl ||
        'https://app.amplience.net';
      const srcImage = await this.assetLibraryService.getAssetById(image.id);
      const imageStudio = new AmplienceImageStudio({
        domain: imageStudioUrl,
      }).withEventListener(ImageStudioEventType.ImageSave, async (data) => {
        return await this.handleOnSaveCallback(data, srcImage, image);
      });

      if (sdkInstance && sdkInstance.hub && sdkInstance.hub.organizationId) {
        imageStudio.withDecodedOrgId(sdkInstance.hub.organizationId);
      }

      await imageStudio.editImages([
        {
          url: srcImage.thumbURL,
          name: srcImage.name,
          mimeType: srcImage.mimeType,
        },
      ]);
    } catch (e) {
      console.error('Image Studio error:', e);
    }
  }
}
