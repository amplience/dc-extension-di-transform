import { MediaImageLink } from 'dc-extensions-sdk';

/** The data type we expect the schema to use. */
export interface DiTransformedImage {
  image?: MediaImageLink;
  crop?: number[];
  poi?: DiTransformPoi;
  rot?: number;
  hue?: number;
  sat?: number;
  bri?: number;
  fliph?: boolean;
  flipv?: boolean;

  query?: string;
}

export interface DiTransformPoi {
  x: number;
  y: number;
}
