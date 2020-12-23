import { Injectable, EventEmitter } from '@angular/core';
import { DiFieldService } from './di-field.service';
import { DiTransformedImage } from '../model/di-transformed-image';
import { MediaImageLink } from 'dc-extensions-sdk';
import { HttpClient } from '@angular/common/http';
import { DiImageMeta } from '../model/di-image-meta';

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
  imageMeta: DiImageMeta;
  imageWidth = 1;
  imageHeight = 1;
  imageSizeMultiplier: number[] = [1, 1];
  imageReady = false;
  imageError: string;

  imageParams = '';

  imageUIProvider: () => Promise<HTMLImageElement>;

  imageSizeLimit = 1000;
  imageChanged: EventEmitter<HTMLImageElement> = new EventEmitter();

  constructor(private field: DiFieldService, private http: HttpClient) {
    if (field.data != null) {
      this.parseDataChange(field.data);
    }
    field.fieldUpdated.subscribe(data => {
      this.parseDataChange(data);
    });
  }

  buildImageSrc(image: MediaImageLink): string {
    return `https://${this.field.getImageHost()}/i/${image.endpoint}/${encodeURIComponent(image.name)}`;
  }

  async loadImage(data: DiTransformedImage) {
    this.imageReady = false;
    this.imageError = null;
    if (data.image != null) {
      let defaultParams = '';
      try {
        this.imageMeta = (await this.http.get(this.buildImageSrc(this.field.data.image) + '.json').toPromise()) as DiImageMeta;
        if (this.imageMeta.status === 'error') {
          throw new Error(this.imageMeta.errorMsg);
        }
        this.imageSizeMultiplier = [this.imageMeta.width / this.imageWidth, this.imageMeta.height / this.imageHeight];
        this.imageWidth = this.imageMeta.width;
        this.imageHeight = this.imageMeta.height;

        // limit size of preview image to a reasonable scale
        if (!this.field.fullRes) {
          if (this.imageWidth > this.imageHeight) {
            if (this.imageWidth > this.imageSizeLimit) {
              defaultParams = `?w=${this.imageSizeLimit}`;
            }
          } else {
            if (this.imageHeight > this.imageSizeLimit) {
              defaultParams = `?h=${this.imageSizeLimit}`;
            }
          }
        }

      } catch {
        console.log('Could not load image metadata... Using width/height from image.');
        this.imageMeta = null;
        this.imageSizeMultiplier = [1, 1];
      }

      const image = await this.imageUIProvider();
      image.onload = this.imageLoaded.bind(this);
      image.onerror = (event: ErrorEvent) => {
        this.imageError = 'Could not load image!';
      };
      this.imageParams = defaultParams;
      image.src = this.buildImageSrc(data.image) + defaultParams;
      this.image = image;
    } else {
      this.image = null;
    }
  }

  async imageLoaded(event: Event) {
    if (this.imageMeta == null) {
      this.imageWidth = (event.target as HTMLImageElement).width;
      this.imageHeight = (event.target as HTMLImageElement).height;
    }

    this.imageReady = true;
    const data = this.field.data;

    if (this.poiPx == null && this.field.isPOIActive()) {
      const bound = this.cropPx || this.getRotatedBounds();
      this.poiPx = [bound[0] + bound[2] * data.poi.x, bound[1] + bound[3] * data.poi.y];
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
    if (this.lastImage !== data.image) {
      if (this.lastImage != null) {
        // clear data from the last image.
        data.crop = [0, 0, 0, 0];
        data.poi = {x: -1, y: -1};
        this.poiPx = null;
      }
      this.loadImage(data);
      this.lastImage = data.image;
    }

    if (this.field.isCropActive()) {
      // crop must be initialized
      this.cropPx = data.crop;
    } else {
      this.cropPx = null;
    }

    if (this.imageReady && this.field.isPOIActive()) {
      // initialize point of interest
      const bounds = this.cropPx || this.getRotatedBounds();
      this.poiPx = [bounds[0] + bounds[2] * data.poi.x, bounds[1] + bounds[3] * data.poi.y];
    } else {
      this.poiPx = null;
    }
  }

  saveCrop() {
    const data = this.field.data;
    for (let i = 0; i < 4; i++) {
      this.cropPx[i] = Math.round(this.cropPx[i]);
    }
    data.crop = this.cropPx;
    this.savePOI(true);
    this.field.updateField();
  }

  savePOI(withoutSave?: boolean) {
    if (this.poiPx == null) {
      return;
    }
    const data = this.field.data;

    // bound the point of interest within the crop area
    const bounds = this.cropPx || this.getRotatedBounds();
    this.poiPx[0] = Math.max(bounds[0], Math.min(bounds[0] + bounds[2], this.poiPx[0]));
    this.poiPx[1] = Math.max(bounds[1], Math.min(bounds[1] + bounds[3], this.poiPx[1]));

    // transform into % terms
    data.poi = {
      x: (this.poiPx[0] - bounds[0]) / bounds[2],
      y: (this.poiPx[1] - bounds[1]) / bounds[3]
    };
    if (!withoutSave) {
      this.field.updateField();
    }
  }
}
