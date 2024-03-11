import { Injectable } from '@angular/core';

import { Asset } from '../model/asset';
import { ImageInfo } from '../model/image-info';
import { DcSdkService } from '../api/dc-sdk.service';

import { MediaImageLink } from 'dc-extensions-sdk/dist/types/lib/components/MediaLink';
import { HttpMethod } from 'dc-extensions-sdk/dist/types/lib/components/HttpClient';

export interface AssetStoreRequestBody {
  hubId: string;
  mode: string;
  assets: {
    src: string;
    name: string;
    label?: string;
    srcName?: string;
    bucketID?: string;
    folderID: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class UploadImageService {
  constructor(private extensionSdk: DcSdkService) {
  }

  async uploadToAssetStore(url: string, imageInfo: ImageInfo): Promise<Asset> {
    try {
      const sdk = await this.extensionSdk.getSDK();
      if (!sdk.hub.id) {
        throw new Error('User has no HubId');
      }

      const payload: AssetStoreRequestBody = {
        hubId: sdk.hub.id,
        mode: 'renameUnique',
        assets: [
          {
            src: url,
            name: imageInfo.srcImage.name,
            label: imageInfo.srcAsset.label,
            srcName: imageInfo.srcAsset.srcName,
            folderID: imageInfo.srcAsset.folderID,
            bucketID: imageInfo.srcAsset.bucketID,
          },
        ],
      };

      const mediaAssetsUrl = sdk.params && sdk.params.installation && sdk.params.installation.mediaAssetsUrl
      const sendAsset = await sdk.client.request({
        url: mediaAssetsUrl || 'https://api.amplience-qa.net/v2/content/media/assets',
        method: 'PUT' as HttpMethod,
        data: JSON.stringify(payload),
      });
      if (sendAsset.status !== 200) {
        throw new Error('Error creating new asset');
      }

      const data = sendAsset.data;
      if (!(typeof data !== 'string') || !data.content || !data.content[0]) {
        throw new Error('Unexpected API response');
      }

      const uploadedAsset: Asset = await sdk.assets.getById(data.content[0].id);
      if (!uploadedAsset) {
        throw new Error('New asset does not exist');
      }
      return uploadedAsset;
    } catch (e) {
      console.error(`Failure during getImageAsset: ${(e as Error).message}`,)
      throw e;
    }
  }

  createImageLinkFromAsset (
    img: MediaImageLink,
    asset: Asset,
  ): MediaImageLink {
    return {
      _meta: {
        schema: img._meta.schema,
      },
      id: asset.id,
      name: asset.name,
      endpoint: img.endpoint,
      defaultHost: img.defaultHost,
    };
  }
}