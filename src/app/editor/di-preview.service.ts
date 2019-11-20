import { Injectable } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { DiFieldService } from './di-field.service';
import { debounce } from 'rxjs/operators';
import { interval, Subject } from 'rxjs';
import { DiImageService } from './di-image.service';

export class DiPreviewImage {
  url: SafeUrl;
  width: number;
  height: number;

  constructor(url: SafeUrl, width: number, height: number) {
    this.url = url;
    this.width = width;
    this.height = height;
  }
}

export class DiTransformationSegment {
  name: string;
  query: string[];
  fields: string[]; // contributing fields - used when we attempt to clear the transformation.
  defaults?: any[]; // optional - defaults to reset the fields to when clearing.

  constructor(name: string, query: string, fields: string[], defaults?: any[]) {
    this.name = name;
    this.query = [query];
    this.fields = fields;
    this.defaults = defaults;
  }

  queryString(): string {
    return this.query.join('&');
  }
}

@Injectable({
  providedIn: 'root'
})
export class DiPreviewService {

  previews: DiPreviewImage[] = [];
  transformations: DiTransformationSegment[] = [];
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

  private addSegment(commands: DiTransformationSegment[], name: string, query: string, field: string, defaultValue?: any): DiTransformationSegment {
    let elem = commands.find((trans) => trans.name === name);
    if (elem == null) {
      elem = new DiTransformationSegment(name, query, [field], [defaultValue]);
      commands.push(elem);
    } else {
      if (query != null) {
        elem.query.push(query);
      }
      elem.fields.push(field);
      elem.defaults.push(defaultValue);
    }
    return elem;
  }

  getDiQuery() {
    const queryCommands: DiTransformationSegment[] = [];
    const data = this.field.data;
    if (data.rot != null && data.rot !== 0) {
      this.addSegment(queryCommands, 'Rotate', `protate=${data.rot}`, 'rot');
    }
    if (data.hue != null && data.hue !== 0) {
      this.addSegment(queryCommands, 'HSB', `hue=${data.hue * (100 / 180)}`, 'hue');
    }
    if (data.sat != null && data.sat !== 0) {
      this.addSegment(queryCommands, 'HSB', `sat=${data.sat}`, 'sat');
    }
    if (data.bri != null && data.bri !== 0) {
      this.addSegment(queryCommands, 'HSB', `bri=${data.bri}`, 'bri');
    }

    if (data.fliph) {
      this.addSegment(queryCommands, 'Flip', `fliph=true`, 'fliph', false);
    }
    if (data.flipv) {
      this.addSegment(queryCommands, 'Flip', `flipv=true`, 'flipv', false);
    }

    if (this.field.isPOIActive()) {
      this.addSegment(queryCommands, 'Point of Interest',
      `poi=${this.decimalRound(data.poi.x, 10000)},${this.decimalRound(data.poi.y, 10000)},0,0&scaleFit=poi`,
      'poi', {x: -1, y: -1});
    }

    if (this.field.isCropActive()) {
      const crop = data.crop;
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
        this.addSegment(queryCommands, 'Crop', `crop={${cropPercent[0]}%},{${cropPercent[1]}%},{${cropPercent[2]}%},{${cropPercent[3]}%}`,
        'crop',
        [0, 0, 0, 0]);
      } else {
        // cropping with no rotation (pcrop)
        this.addSegment(queryCommands, 'Crop', `pcrop=${Math.round(crop[0])},${Math.round(crop[1])},${Math.round(crop[2])},${Math.round(crop[3])}`,
        'crop',
        [0, 0, 0, 0]);
      }
      this.addSegment(queryCommands, 'Crop', null, 'aspectLock', 'clear');
    }
    this.transformations = queryCommands;
    return queryCommands.map(command => command.queryString()).join('&');
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
    const baseQuery = `http://${this.field.getImageHost()}/i/${image.endpoint}/${encodeURIComponent(image.name)}?` + data.query;
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
