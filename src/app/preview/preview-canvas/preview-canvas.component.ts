import { Component, OnInit, Input, Output, EventEmitter, ElementRef, ViewChild, OnChanges } from '@angular/core';
import { MediaImageLink } from 'dc-extensions-sdk';
import { DiTransformedImage } from 'src/app/model/di-transformed-image';
import { DomSanitizer, SafeStyle, SafeUrl } from '@angular/platform-browser';
import { QueryValueType } from '@angular/compiler/src/core';
import { throwMatDialogContentAlreadyAttachedError, throwMatDuplicatedDrawerError } from '@angular/material';
import { Subject, interval } from 'rxjs';
import { debounce } from 'rxjs/operators';
import { ThrowStmt } from '@angular/compiler';
import { DiImageService } from 'src/app/editor/di-image.service';
import { DiPreviewService } from 'src/app/editor/di-preview.service';
import { EditorService, PreviewMode } from 'src/app/editor/editor.service';
import { DiFieldService } from 'src/app/editor/di-field.service';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { ImageTransformerService } from '../image-transformer.service';

@Component({
  selector: 'amp-preview-canvas',
  templateUrl: './preview-canvas.component.html',
  styleUrls: ['./preview-canvas.component.scss']
})
export class PreviewCanvasComponent implements OnInit, OnChanges {

  image: MediaImageLink;
  data: DiTransformedImage;

  get isCrop(): boolean {
    return this.editor.previewMode === PreviewMode.EditCrop && !this.isPOI;
  }

  get isPreview(): boolean {
    return this.editor.previewMode === PreviewMode.View;
  }

  get isPOI(): boolean {
    // when crop and POI are exclusive, poi mode is a special aspect lock.
    return this.field.data.aspectLock === 'poi'; // this.editor.previewMode === PreviewMode.POI;
  }

  get isPOIActive(): boolean {
    return this.field.isPOIActive();
  }

  get isLoading(): boolean {
    return !this.dimage.imageReady;
  }

  get hasImage(): boolean {
    return this.field.isImageActive();
  }

  get imageError(): string {
    return this.dimage.imageError;
  }

  @ViewChild('imageContainer', {static: false}) imageContainer: ElementRef<HTMLDivElement>;
  @ViewChild('canvas', {static: false}) canvas: ElementRef<HTMLDivElement>;
  @ViewChild('image', {static: false}) imageElem: ElementRef<HTMLImageElement>;
  @ViewChild('imageCanvas', {static: false}) imageCanvas: ElementRef<HTMLCanvasElement>;

  get imageWidth(): number { return this.dimage.imageWidth; }
  get imageHeight(): number { return this.dimage.imageHeight; }

  get cropPx(): number[] { return this.dimage.cropPx; }
  set cropPx(value: number[]) { this.dimage.cropPx = value; }

  get poiPx(): number[] { return this.dimage.poiPx; }
  set poiPx(value: number[]) { this.dimage.poiPx = value; }

  // scale related parameters
  scale = 1;
  private lastRotation;
  canvasTransform: SafeStyle;
  handleHSize = '-4px';
  handleSize = '8px';
  cropRectStroke = '2px';
  outlineSize = '1000px';

  private activeAspect: number;

  private movingHandle = -1;
  private lastPos: number[];
  private lastFlip: boolean[] = [false, false];

  constructor(private myElem: ElementRef<Element>, private sanitizer: DomSanitizer, private dimage: DiImageService,
              public editor: EditorService, private field: DiFieldService, private transform: ImageTransformerService) {
    this.dataUpdated(this.field.data);
    this.dimage.imageChanged.subscribe((image) => {
      this.updateCanvasTransform();
      this.renderCanvas(true);
    });
    editor.modeChange.subscribe((mode) => {
      this.updateTransformFrames(2);
    });
    editor.entered.subscribe((mode) => {
      this.updateTransformFrames(30);
    });
    field.fieldUpdated.subscribe((data: DiTransformedImage) => {
      this.dataUpdated(data);
    });
    window.addEventListener('resize', () => { this.updateCanvasTransform(); });
  }

  getImageHost(): string {
    return this.field.getImageHost();
  }

  renderCanvas(force: boolean) {
    const data = this.data;
    if (this.dimage.imageReady && data != null) {
      this.transform.renderCanvas(this.imageCanvas.nativeElement, this.imageElem.nativeElement, data, force);
    }
  }

  dataUpdated(data: DiTransformedImage) {
    this.data = data;
    this.image = (data == null) ? null : data.image;

    if (data != null) {
      this.updateTransformFrames(1);
      const isAspect = data.aspectLock != null && data.aspectLock.indexOf(':') !== -1;

      // ensure that poi and crop are exclusive
      if (data.aspectLock === 'poi') {
        data.crop = [0, 0, 0, 0];
        this.cropPx = null;
      } else {
        data.poi = {x: -1, y: -1};
        this.poiPx = null;
      }

      if (isAspect) {
        // attempt to lock aspect of the crop rectangle
        const split = data.aspectLock.split(':');
        if (split.length === 2) {
          const aspect = Number(split[0]) / Number(split[1]);
          if (this.dimage.imageReady) {
            this.forceAspect(aspect);
          } else {
            // image is not ready, so we are loading the data for the first time.
            this.activeAspect = aspect; // set the current aspect but do not process the change.
          }
        }
      } else {
        this.activeAspect = null;
      }
      this.renderCanvas(false);
    }
  }

  ngOnInit() {
    this.dimage.imageUIProvider = this.getImageElem.bind(this);
  }

  public getImageElem(): Promise<HTMLImageElement> {
    // it's possible that the image element has not been created yet
    // if we're calling this function, we should be in a state where angular will create it
    // so just wait a few frames until it does.
    return new Promise((resolve, reject) => {
      if (this.imageElem == null) {
        let continueFunc;
        continueFunc = () => {
          if (this.imageElem == null) {
            requestAnimationFrame(continueFunc);
          } else {
            resolve(this.imageElem.nativeElement);
          }
        };
        requestAnimationFrame(continueFunc);
      } else {
        resolve(this.imageElem.nativeElement);
      }
    });
  }

  ngOnChanges(changes) {
  }

  getImageTransform(): SafeStyle {
    const transformCommands: string[] = [];
    if (this.data.rot != null) {
      transformCommands.push(`rotate(${this.data.rot}deg)`);
    }
    return this.sanitizer.bypassSecurityTrustStyle(transformCommands.join(' '));
  }

  updateTransformFrames(frames: number) {
    requestAnimationFrame(() => {
      this.updateCanvasTransform();
      frames--;
      if (frames > 0) {
        this.updateTransformFrames(frames);
      }
    });
  }

  updateCanvasTransform() {
    if (this.canvas == null) {
      return;
    }
    const container = this.canvas.nativeElement;

    // const size = [window.innerWidth - 20, 500 - 20];
    const size = [container.clientWidth - 20, container.clientHeight - 20];

    /*
    if (!this.isPreview) {
      size[0] -= 201;
      size[1] -= 42;
    }
    */

    const bounds = this.dimage.getRotatedBounds();
    const imageSize = (this.isPreview && this.cropPx != null) ? [this.cropPx[2], this.cropPx[3]] : [bounds[2], bounds[3]];

    const transformCommands: string[] = [];

    const scale = Math.min(1, size[0] / imageSize[0], size[1] / imageSize[1]);
    this.handleHSize = (-4 / scale) + 'px';
    this.handleSize = (8 / scale) + 'px';
    this.cropRectStroke = (2 / scale) + 'px';
    this.outlineSize = (Math.max(size[0], size[1]) / scale) + 'px';
    this.scale = scale;
    transformCommands.push(`scale(${scale}, ${scale})`);

    if (this.data.fliph || this.data.flipv) {
      transformCommands.push(`scale(${this.data.fliph ? -1 : 1}, ${this.data.flipv ? -1 : 1})`);
    }

    // crop offset - in preview mode, offset the image to the middle
    if (this.isPreview && this.cropPx != null) {
      const centerOff = [
        this.imageWidth / 2 - (this.cropPx[0] + this.cropPx[2] / 2),
        this.imageHeight / 2 - (this.cropPx[1] + this.cropPx[3] / 2),
      ];
      transformCommands.push(`translate(${centerOff[0]}px, ${centerOff[1]}px)`);
    }

    this.lastFlip = [this.data.fliph, this.data.flipv];
    this.canvasTransform = this.sanitizer.bypassSecurityTrustStyle(transformCommands.join(' '));
  }

  getImageFilter(): SafeStyle {
    const useCSS = false;
    if (useCSS) {
      const filterCommands: string[] = [];
      if (this.data.hue != null) {
        filterCommands.push(`hue-rotate(${this.data.hue}deg)`);
      }
      if (this.data.sat != null) {
        filterCommands.push(`saturate(${this.diIntensityToBrowser(this.data.sat)})`);
      }
      if (this.data.bri != null) {
        filterCommands.push(`brightness(${this.diIntensityToBrowser(this.data.bri)})`);
      }
      this.sanitizer.bypassSecurityTrustStyle(filterCommands.join(' '));
    } else {
      return this.sanitizer.bypassSecurityTrustStyle('');
    }
  }

  private boundSize(size: number[], bounds: number[]) {
    if (size[0] > bounds[2]) {
      size[1] *= bounds[2] / size[0];
      size[0] *= bounds[2] / size[0];
    }
    if (size[1] > bounds[3]) {
      size[0] *= bounds[3] / size[1];
      size[1] *= bounds[3] / size[1];
    }
  }

  private forceAspect(aspect: number) {
    const bounds = this.dimage.getRotatedBounds();
    if (this.cropPx == null || (this.activeAspect !== aspect)) {
      this.cropPx = bounds;
    }

    // find a target size less than the size, based on the current size
    // a good choice is the average of aspect correcting both dimensions, limited to the size of the bounds

    const aspectBound1 = [this.cropPx[2], this.cropPx[2] / aspect];
    const aspectBound2 = [this.cropPx[3] * aspect, this.cropPx[3]];

    if (this.dimage.imageReady) {
      this.boundSize(aspectBound1, bounds);
      this.boundSize(aspectBound2, bounds);
    }

    const newBound = [(aspectBound1[0] + aspectBound2[0]) / 2.0, (aspectBound1[1] + aspectBound2[1]) / 2.0];

    // if holding the rectangle by a corner, anchor it to the opposite corner

    switch (this.movingHandle) {
      case 0: // top left: anchor to bottom right
        this.cropPx[0] = this.cropPx[0] + this.cropPx[2] - newBound[0];
        this.cropPx[1] = this.cropPx[1] + this.cropPx[3] - newBound[1];
        break;
      case 1: // top right: anchor to bottom left
        this.cropPx[1] = this.cropPx[1] + this.cropPx[3] - newBound[1];
        break;
      case 2: // bottom right: anchor to top left (default)
        break;
      case 3: // bottom left: anchor to top right
        this.cropPx[0] = this.cropPx[0] + this.cropPx[2] - newBound[0];
        break;
    }

    this.cropPx[2] = newBound[0];
    this.cropPx[3] = newBound[1];

    // move the rectangle back in bounds, if necessary
    const boundLimitX = bounds[0] + bounds[2];
    if (this.cropPx[0] + this.cropPx[2] > boundLimitX) {
      this.cropPx[0] = boundLimitX - this.cropPx[2];
    }
    const boundLimitY = bounds[1] + bounds[3];
    if (this.cropPx[1] + this.cropPx[3] > boundLimitY) {
      this.cropPx[1] = boundLimitY - this.cropPx[3];
    }

    if (this.cropPx[0] < bounds[0]) {
      this.cropPx[0] = bounds[0];
    }
    if (this.cropPx[1] < bounds[1]) {
      this.cropPx[1] = bounds[1];
    }
    this.saveCrop();
    this.activeAspect = aspect;
  }

  private diIntensityToBrowser(intensity: number): number {
    return intensity / 100 + 1;
  }

  escapeUrl(text: string): string {
    return encodeURIComponent(text);
  }

  moveHandle(event: MouseEvent) {
    const pos = this.getMousePosition(event);
    const localx = pos[0];
    const localy = pos[1];
    const bounds = this.dimage.getRotatedBounds();
    switch (this.movingHandle) {
      case 0:
        this.cropPx[2] = (this.cropPx[0] + this.cropPx[2]) - localx; // width anchored to old width
        this.cropPx[3] = (this.cropPx[1] + this.cropPx[3]) - localy; // height anchored to old height
        this.cropPx[0] = localx; // x
        this.cropPx[1] = localy; // y
        break;
      case 1: // top right (x is unchanged)
        this.cropPx[3] = (this.cropPx[1] + this.cropPx[3]) - localy; // height anchored to old height
        this.cropPx[1] = localy; // y
        this.cropPx[2] = localx - this.cropPx[0]; // width anchored to left
        break;
      case 2: // bottom right
        this.cropPx[2] = localx - this.cropPx[0]; // width anchored to left
        this.cropPx[3] = localy - this.cropPx[1]; // width anchored to top
        break;
      case 3: // bottom left
        this.cropPx[2] = (this.cropPx[0] + this.cropPx[2]) - localx; // width anchored to old width
        this.cropPx[0] = localx; // x
        this.cropPx[3] = localy - this.cropPx[1]; // height anchored to top
        break;

      case 4: // move box
        let delta = (this.lastPos == null) ? [0, 0] : [localx - this.lastPos[0], localy - this.lastPos[1]];
        const allowedMove = [
          this.cropPx[0] - bounds[0], // how much we can move left
          this.cropPx[1] - bounds[1], // how much we can move up
          (bounds[2] + bounds[0]) - (this.cropPx[2] + this.cropPx[0]), // how much we can move right
          (bounds[3] + bounds[1]) - (this.cropPx[3] + this.cropPx[1]), // how much we can move down
        ];
        delta = this.clampMovement(delta, allowedMove);
        this.cropPx[0] += delta[0];
        this.cropPx[1] += delta[1];
        this.lastPos = [localx, localy];
        break;
      case 5: // creating a box
        this.cropPx = [localx, localy, 1, 1];
        this.movingHandle = 2;
        break;
    }
    this.clampCrop(bounds);
    this.saveCrop();
  }

  movePOI(event: MouseEvent) {
    const pos = this.getMousePosition(event);
    const localx = pos[0];
    const localy = pos[1];

    this.poiPx = [localx, localy];
    this.savePOI();
  }

  upHandle(event: MouseEvent) {
    if (this.field.isCropActive && (this.field.data.aspectLock == null || this.field.data.aspectLock === 'clear')) {
      this.data.aspectLock = 'none';
      this.field.updateField();
    }
    this.lastPos = null;
  }

  globalOffset(elem: HTMLElement): number[] {
    if (elem.offsetParent == null) {
      return [elem.offsetLeft, elem.offsetTop];
    } else {
      const parent = this.globalOffset(elem.offsetParent as HTMLElement);
      return [elem.offsetLeft + parent[0], elem.offsetTop + parent[1]];
    }
  }

  private getMousePosition(event: MouseEvent): number[] {
    const container = this.imageContainer.nativeElement;
    const offset = this.globalOffset(container);
    const ctrx = event.clientX - (offset[0] + this.imageWidth / 2);
    const ctry = event.clientY - (offset[1] + this.imageHeight / 2);

    const scalex = (this.data.fliph ? -1 : 1) / this.scale;
    const scaley = (this.data.flipv ? -1 : 1) / this.scale;

    const localx = ctrx * scalex + this.imageWidth / 2;
    const localy = ctry * scaley + this.imageHeight / 2;
    return [localx, localy];
  }

  private clampCrop(clamp: number[]) {
    if (this.activeAspect != null) {
      this.forceAspect(this.activeAspect);
    }
    this.cropPx = [
      Math.min(Math.max(this.cropPx[0], clamp[0]), clamp[2] + clamp[0]),
      Math.min(Math.max(this.cropPx[1], clamp[1]), clamp[3] + clamp[1]),
      Math.max(0, Math.min(this.cropPx[2] + this.cropPx[0], clamp[2] + clamp[0])),
      Math.max(0, Math.min(this.cropPx[3] + this.cropPx[1], clamp[3] + clamp[1])),
    ];
    this.cropPx[2] -= this.cropPx[0];
    this.cropPx[3] -= this.cropPx[1];
    if (this.cropPx[2] < 1) {
      this.cropPx[2] = 1;
    }
    if (this.cropPx[3] < 1) {
      this.cropPx[3] = 1;
    }
  }

  private clampMovement(delta: number[], allowed: number[]) {
    if (delta[0] < -allowed[0]) {
      delta[0] = -allowed[0];
    }
    if (delta[1] < -allowed[1]) {
      delta[1] = -allowed[1];
    }
    if (delta[0] > allowed[2]) {
      delta[0] = allowed[2];
    }
    if (delta[1] > allowed[3]) {
      delta[1] = allowed[3];
    }
    return delta;
  }

  saveCrop() {
    this.dimage.saveCrop();
  }

  savePOI(withoutSave?: boolean) {
    this.dimage.savePOI(withoutSave);
  }

  grabCropHandle(handle: number) {
    // handle is 0 for top left, incrementing clockwise
    if (this.isCrop) {
        if (handle === 5 && this.field.isCropActive()) {
          return;
        }
        this.movingHandle = handle;
        const moveEvent = this.moveHandle.bind(this);
        this.bindMouseEvent(moveEvent, this.upHandle.bind(this));
    } else if (this.isPOI) {
        // place point of interest
        if (handle !== 5) {
          return;
        }
        if (!this.field.isPOIActive()) {
          this.field.data.poi = {x: 0.5, y: 0.5};
        }
        this.grabPOI();
    }
  }

  grabPOI() {
    if (!this.isPOI) {
      return;
    }
    const moveEvent = this.movePOI.bind(this);
    this.bindMouseEvent(moveEvent, this.upHandle.bind(this));
  }

  private bindMouseEvent(moveEvent, upHandle) {
    let upEvent;
    const outEvent = (event: MouseEvent) => {
      if (!(event.relatedTarget)) {
        upEvent(event);
      }
    };
    upEvent = (event: MouseEvent) => {
      this.myElem.nativeElement.removeEventListener('mousemove', moveEvent);
      window.removeEventListener('mouseup', upEvent);
      window.removeEventListener('mouseout', outEvent);
      upHandle(event);
    };
    this.myElem.nativeElement.addEventListener('mousemove', moveEvent);
    window.addEventListener('mouseup', upEvent);
    window.addEventListener('mouseout', outEvent);
  }
}
