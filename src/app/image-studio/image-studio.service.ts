import { Injectable } from '@angular/core';
import { DcSdkService } from '../api/dc-sdk.service';
import { AmplienceImageStudio } from '@amplience/image-studio-sdk/dist/esm';
import { DiFieldService } from '../editor/di-field.service';
import { AssetLibraryService } from './asset-library.service';
import {
  ImageSaveEventData,
  ImageStudioEventType,
  SDKEventType,
} from '@amplience/image-studio-sdk';

@Injectable({
  providedIn: 'root',
})
export class ImageStudioService {
  constructor(
    private sdkService: DcSdkService,
    private assetLibraryService: AssetLibraryService,
    private diFieldService: DiFieldService
  ) {}

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
      });

      if (sdkInstance.hub.organizationId) {
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
