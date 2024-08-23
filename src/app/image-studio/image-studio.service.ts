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
      const imageStudioUrl = sdkInstance.params.installation.imageStudioUrl || "https://app.amplience.net/image-studio";
      const srcImage = await this.assetLibraryService.getAssetById(image.id);
      const imageStudio = new AmplienceImageStudio({
        baseUrl: imageStudioUrl,
      });

      const studioResponse = await imageStudio.launch({
        image: {
          url: srcImage.thumbURL,
          name: srcImage.name,
        },
      });

      if (studioResponse && studioResponse.image) {
        const uploadedAsset = await this.assetLibraryService.uploadAsset(
          studioResponse.image.url,
          studioResponse.image.name,
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