import { Injectable } from '@angular/core';
import { DiTransformedImage } from '../model/di-transformed-image';
import { DiPreviewService, DiTransformationSegment } from '../editor/di-preview.service';
import { debounce } from 'rxjs/operators';
import { interval } from 'rxjs';
import { throwToolbarMixedModesError } from '@angular/material';

@Injectable({
  providedIn: 'root'
})
export class ImageTransformerService {

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  cachedHSVImage: HTMLImageElement;
  cachedHSVImageLoaded = false;
  lastTransform: number[] = [];

  constructor(private diPreview: DiPreviewService) {
    const db = diPreview.transformationsChanged.pipe(debounce(() => interval(666)));
    db.subscribe(this.updateCachedHSV.bind(this));
  }

  updateCachedHSV(transformations: DiTransformationSegment[]) {
    const queryString = transformations.filter(x => x.name === 'HSB').map(command => command.queryString()).join('&');
    if (queryString.length === 0) {
      // do not need a transformation
      this.cachedHSVImage = null;
      this.cachedHSVImageLoaded = false;
      return;
    }
    const imgSrc = this.diPreview.getCustomQueryURL(queryString);

    if (this.cachedHSVImage != null && this.cachedHSVImage.src === imgSrc) {
      return;
    }
    const cachedImage = new Image();
    this.cachedHSVImage = cachedImage;
    cachedImage.crossOrigin = 'anonymous';
    cachedImage.onload = () => {
      if (cachedImage !== this.cachedHSVImage) {
        return;
      }
      this.cachedHSVImageLoaded = true;
      this.drawCachedHSV();
    };
    cachedImage.src = imgSrc;
  }

  drawCachedHSV() {
    const canvas = this.canvas;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.drawImage(this.cachedHSVImage, 0, 0);
  }

  renderCanvas(canvas: HTMLCanvasElement, imageElem: HTMLImageElement, data: DiTransformedImage, force: boolean) {
    if (canvas !== this.canvas) {
      this.initCanvas(canvas);
      this.lastTransform = [];
    }
    if (canvas.width !== imageElem.width || canvas.height !== imageElem.height) {
      canvas.width = imageElem.width;
      canvas.height = imageElem.height;
      this.lastTransform = [];
    }
    if (force) {
      this.lastTransform = [];
    }

    const transform = [data.hue, data.sat, data.bri];
    if (!this.transformDirty(transform)) {
      if (this.cachedHSVImageLoaded) {
        this.drawCachedHSV();
      }
      return;
    }
    this.lastTransform = transform;
    this.cachedHSVImageLoaded = false;
    this.cachedHSVImage = null;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.drawImage(imageElem, 0, 0);
    if (this.transformNeeded()) {
      this.applyFilters(data);
    }
  }

  private initCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  private transformDirty(transform: number[]): boolean {
    if (transform.length !== this.lastTransform.length) {
      return true;
    }
    for (let i = 0; i < transform.length; i++) {
      if (this.lastTransform[i] !== transform[i]) {
        return true;
      }
    }
    return false;
  }

  private transformNeeded() {
    return this.lastTransform.findIndex(value => (value !== 0 && value != null)) !== -1;
  }

  applyFilters(meta: DiTransformedImage) {
    const idata = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = idata.data;

    const hMod = ((meta.hue || 0) + 360) % 360;
    const sMod = 1 + (meta.sat || 0) / 100;
    const lMod = 1 + (meta.bri || 0) / 100;

    const dataLength = data.length;
    for (let i = 0; i < dataLength; i += 4) {
      // for each pixel

      // calculate its hsl value
      let r = data[i] / 255;
      let g = data[i + 1] / 255;
      let b = data[i + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;

      let h: number;
      if (delta === 0) {
        h = 0;
      } else if (max === r) {
        h = 60 * (((g - b) / delta + 6) % 6);
      } else if (max === g) {
        h = 60 * ((b - r) / delta + 2);
      } else {
        h = 60 * ((r - g) / delta + 4);
      }
      let l = (max + min) / 2;
      let s = (delta === 0) ? 0 : (delta / (1 - Math.abs(2 * l - 1)));

      h = (h + hMod) % 360;
      s = Math.min(1, (s * sMod));
      l = (l * lMod);

      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = l - c / 2;

      const hSeg = Math.floor(h / 60);
      switch (hSeg) {
        case 0:
          r = c; g = x; b = 0; break;
        case 1:
          r = x; g = c; b = 0; break;
        case 2:
          r = 0; g = c; b = x; break;
        case 3:
          r = 0; g = x; b = c; break;
        case 4:
          r = x; g = 0; b = c; break;
        case 5:
          r = c; g = 0; b = x; break;
      }

      data[i] = Math.round((r + m) * 255);
      data[i + 1] = Math.round((g + m) * 255);
      data[i + 2] = Math.round((b + m) * 255);
    }

    this.ctx.putImageData(idata, 0, 0);
  }
}
