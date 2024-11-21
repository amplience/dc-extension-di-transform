import { Injectable } from '@angular/core';
import { DcSdkService } from '../api/dc-sdk.service';
import { AmplienceImageStudio } from "@amplience/image-studio-sdk/dist/esm";
import { DiFieldService } from '../editor/di-field.service';
import { AssetLibraryService } from './asset-library.service';

@Injectable({
  providedIn: 'root'
})
export class ImageStudioService {


  constructor(private sdkService: DcSdkService, private assetLibraryService: AssetLibraryService, private diFieldService: DiFieldService) { }

  public async openImageStudio(image) {
    try {
      const sdkInstance = await this.sdkService.getSDK();
      const imageStudioUrl =
        sdkInstance.params.installation.imageStudioUrl ||
        "https://app.amplience.net";
      const srcImage = await this.assetLibraryService.getAssetById(image.id);
      const imageStudio = new AmplienceImageStudio({
        domain: imageStudioUrl,
      });

      if (sdkInstance.hub.organizationId) {
        imageStudio.withDecodedOrgId(sdkInstance.hub.organizationId);
      }

      const studioResponse = await imageStudio.editImages([
        {
          url: srcImage.thumbURL,
          name: srcImage.name,
          mimeType: srcImage.mimeType,
        },
      ]);

      if (studioResponse && studioResponse.image) {
        const uploadedAsset = await this.assetLibraryService.uploadAsset(
          studioResponse.image,
          srcImage
        );
        const imageLink = this.assetLibraryService.createImageLinkFromAsset(
          image,
          uploadedAsset
        );

        this.diFieldService.updateImageValue(imageLink);
      }
    } catch (e) {
      console.error("Image Studio error:", e);
    }
  }
}