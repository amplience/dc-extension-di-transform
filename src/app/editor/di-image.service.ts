import { Injectable, EventEmitter } from '@angular/core';
import { DiFieldService } from './di-field.service';
import { DiTransformedImage } from '../model/di-transformed-image';
import { MediaImageLink } from 'dc-extensions-sdk';

/**
 * Handles image related fields in the content item, such as crop and point of interest.
 * These require information such as the image width and height, therefore the image must
 * be loaded to process the fields.
 */
@Injectable({
  providedIn: 'root'
})
export class DiImageService {

  cropPx: number[];
  poiPx: number[];

  lastImage: MediaImageLink;
  image: HTMLImageElement;
  imageWidth = 1;
  imageHeight = 1;

  imageChanged: EventEmitter<HTMLImageElement> = new EventEmitter();

  constructor(private field: DiFieldService) {
    if (field.data != null) {
      this.parseDataChange(field.data);
    }
    field.fieldUpdated.subscribe(data => {
      this.parseDataChange(data);
    });
  }

  buildImageSrc(image: MediaImageLink): string {
    return `https://${image.defaultHost}/i/${image.endpoint}/${encodeURIComponent(image.name)}`;
  }

  loadImage(data: DiTransformedImage) {
    const image = new Image();
    image.onload = this.imageLoaded.bind(this);
    if (data.image != null) {
      image.src = this.buildImageSrc(data.image);
    }

    this.image = image;
  }

  imageLoaded(event: Event) {
    this.imageWidth = (event.target as HTMLImageElement).width;
    this.imageHeight = (event.target as HTMLImageElement).height;
    const data = this.field.data;

    if (this.cropPx == null) {
      this.cropPx = [0, 0, this.imageWidth, this.imageHeight];
      if (data.crop[0] != null) {
        this.saveCrop();
      }
    }

    if (this.poiPx == null) {
      this.poiPx = [this.cropPx[0] + this.cropPx[2] / 2, this.cropPx[1] + this.cropPx[3] / 2];
    }

    this.imageChanged.emit(this.image);
  }

  private rotatePoint(point: number[], angle: number): number[] {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    return [cos * point[0] + sin * point[1], cos * point[1] - sin * point[0]];
  }

  getRotatedBounds() {
    const hw = this.imageWidth / 2;
    const hh = this.imageHeight / 2;
    let angle = this.field.data.rot;
    if (angle == null) {
      angle = 0;
    }
    angle = (angle / 180) * Math.PI;
    const corner1 = this.rotatePoint([hw, hh], angle);
    const corner2 = this.rotatePoint([hw, -hh], angle);

    const newHalfWidth = Math.max(Math.abs(corner1[0]), Math.abs(corner2[0]));
    const newHalfHeight = Math.max(Math.abs(corner1[1]), Math.abs(corner2[1]));

    return [hw - newHalfWidth, hh - newHalfHeight, newHalfWidth * 2, newHalfHeight * 2];
  }

  parseDataChange(data: DiTransformedImage) {
    if (data.crop[0] != null) {
      // crop must be initialized
      this.cropPx = data.crop;
    } else {
      this.cropPx = null;
    }

    if (this.poiPx == null && data.poi != null && data.poi.x != null && this.cropPx != null) {
      // initialize point of interest
      this.poiPx = [this.cropPx[0] + this.cropPx[2] * data.poi.x, this.cropPx[1] + this.cropPx[3] * data.poi.y];
    }

    if (this.lastImage !== data.image) {
      this.loadImage(data);
    }
  }

  saveCrop() {
    const data = this.field.data;
    data.crop = this.cropPx;
    this.savePOI(true);
    this.field.updateField();
  }

  savePOI(withoutSave?: boolean) {
    const data = this.field.data;

    // bound the point of interest within the crop area
    const bounds = this.cropPx;
    this.poiPx[0] = Math.max(bounds[0], Math.min(bounds[0] + bounds[2], this.poiPx[0]));
    this.poiPx[1] = Math.max(bounds[1], Math.min(bounds[1] + bounds[3], this.poiPx[1]));

    // transform into % terms
    data.poi = {
      x: (this.poiPx[0] - this.cropPx[0]) / this.cropPx[2],
      y: (this.poiPx[1] - this.cropPx[1]) / this.cropPx[3]
    };
    if (!withoutSave) {
      this.field.updateField();
    }
  }
}
