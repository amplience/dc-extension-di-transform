import { Injectable } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { DiFieldService } from './di-field.service';
import { debounce } from 'rxjs/operators';
import { interval, Subject } from 'rxjs';
import { DiImageService } from './di-image.service';

class DiPreviewImage {
  url: SafeUrl;
  width: number;
  height: number;

  constructor(url: SafeUrl, width: number, height: number) {
    this.url = url;
    this.width = width;
    this.height = height;
  }
}

@Injectable({
  providedIn: 'root'
})
export class DiPreviewService {

  previews: DiPreviewImage[] = [];
  private updated = new Subject();

  constructor(private field: DiFieldService, private image: DiImageService) {
    field.fieldUpdated.subscribe(data => {
      this.updated.next(true);
    });

    const db = this.updated.pipe(debounce(() => interval(100)));
    db.subscribe(() => {
      this.updateDiQuery();
    });
  }

  private decimalRound(value: number, mul: number) {
    return Math.round(value * mul) / mul;
  }

  getDiQuery() {
    const queryCommands: string[] = [];
    const data = this.field.data;
    if (data.rot != null) {
      queryCommands.push(`protate=${data.rot}`);
    }
    if (data.hue != null) {
      queryCommands.push(`hue=${data.hue * (100 / 180)}`);
    }
    if (data.sat != null) {
      queryCommands.push(`sat=${data.sat}`);
    }
    if (data.bri != null) {
      queryCommands.push(`bri=${data.bri}`);
    }

    if (data.fliph) {
      queryCommands.push(`fliph=true`);
    }
    if (data.flipv) {
      queryCommands.push(`flipv=true`);
    }

    if (data.poi) {
      queryCommands.push(`poi=${data.poi.x},${data.poi.y},0,0`);
      queryCommands.push(`scaleFit=poi`);
    }

    const crop = this.image.cropPx;
    if (data.rot != null && data.rot !== 0) {
      // cropping after a rotation. protate then crop. if the user wants to crop after this, they should use ecrop.
      // rotating resizes the image so we're going to want to use percentage calculations to align crops to the center

      const bounds = this.image.getRotatedBounds();
      const xOff = Math.round((this.image.imageWidth / 2) - crop[0]);
      const yOff = Math.round((this.image.imageHeight / 2) - crop[1]);

      const cropPercent = [
        this.decimalRound((crop[0] - bounds[0]) / bounds[2] * 100, 100),
        this.decimalRound((crop[1] - bounds[1]) / bounds[3] * 100, 100),
        this.decimalRound(crop[2] / bounds[2] * 100, 100),
        this.decimalRound(crop[3] / bounds[3] * 100, 100),
      ];

      queryCommands.push(`crop={${cropPercent[0]}%},{${cropPercent[1]}%},{${cropPercent[2]}%},{${cropPercent[3]}%}`);
    } else {
      // cropping with no rotation (pcrop)
      queryCommands.push(`pcrop=${Math.round(crop[0])},${Math.round(crop[1])},${Math.round(crop[2])},${Math.round(crop[3])}`);
    }
    return '?' + queryCommands.join('&');
  }

  updateDiQuery() {
    const data = this.field.data;
    data.query = this.getDiQuery();
    const bounds = this.image.getRotatedBounds();
    const image = data.image;
    if (image == null) {
      this.previews = null;
      return;
    }

    const previewSize = 141;
    const previewPoi = data.rot === undefined || data.rot === 0;
    const baseQuery = `https://${image.defaultHost}/i/${image.endpoint}/${encodeURIComponent(image.name)}` + data.query;
    if (previewPoi) {
      this.previews = [];
      this.previews.push(new DiPreviewImage(baseQuery + `&sm=aspect&aspect=1:1&w=${previewSize}`, previewSize, previewSize));
      this.previews.push(new DiPreviewImage(baseQuery + `&sm=aspect&aspect=2:3&h=${previewSize}`, previewSize * 2 / 3, previewSize));
      this.previews.push(new DiPreviewImage(baseQuery + `&sm=aspect&aspect=3:2&w=${previewSize}`, previewSize, previewSize * 2 / 3));
    } else {
      let width = previewSize;
      let height = previewSize * this.image.cropPx[3] / this.image.cropPx[2];
      if (height > previewSize) {
        width /= height / previewSize;
        height /= height / previewSize;
      }
      const requestWidth = Math.round(width * bounds[2] / this.image.cropPx[2]);
      const requestHeight = Math.round(height * bounds[3] / this.image.cropPx[3]);
      this.previews = [new DiPreviewImage(baseQuery + `&w=${requestWidth}&h=${requestHeight}`, width, height)];
    }
  }
}
