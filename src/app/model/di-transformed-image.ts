import { MediaImageLink } from 'dc-extensions-sdk/dist/types/lib/components/MediaLink';


/** The data type we expect the schema to use. */
export interface DiTransformedImage {
  image?: MediaImageLink;
  crop: number[];
  poi: DiTransformPoi;
  rot: number;
  hue: number;
  sat: number;
  bri: number;
  fliph: boolean;
  flipv: boolean;

  aspectLock: string;
  query: string;

  // Delivered image dimensions & aspect ratio (incl post-crop changes)
  // Useful for reserving layout space to prevent CLS
  width?: number;
  height?: number;
  aspectRatio?: number;
}

export interface DiTransformPoi {
  x: number;
  y: number;
}
