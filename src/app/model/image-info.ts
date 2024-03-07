import { MediaImageLink } from 'dc-extensions-sdk/dist/types/lib/components/MediaLink';
import { AssetInfo } from './asset-info';

export interface ImageInfo {
    srcAsset: AssetInfo;
    srcImage: MediaImageLink;
  }