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

@Component({
  selector: 'amp-preview-canvas',
  templateUrl: './preview-canvas.component.html',
  styleUrls: ['./preview-canvas.component.scss']
})
export class PreviewCanvasComponent implements OnInit, OnChanges {

  image: MediaImageLink;
  data: DiTransformedImage;

  get isCrop(): boolean {
    return this.editor.previewMode === PreviewMode.EditCrop;
  }

  get isPreview(): boolean {
    return this.editor.previewMode === PreviewMode.View;
  }

  get isPOI(): boolean {
    return this.editor.previewMode === PreviewMode.POI;
  }

  @ViewChild('imageContainer', {static: false}) imageContainer: ElementRef<HTMLDivElement>;
  @ViewChild('canvas', {static: false}) canvas: ElementRef<HTMLDivElement>;

  get imageWidth(): number { return this.dimage.imageWidth; }
  get imageHeight(): number { return this.dimage.imageHeight; }

  get cropPx(): number[] { return this.dimage.cropPx; }
  set cropPx(value: number[]) { this.dimage.cropPx = value; }

  get poiPx(): number[] { return this.dimage.poiPx; }
  set poiPx(value: number[]) { this.dimage.poiPx = value; }

  // scale related parameters
  scale = 1;
  private lastRotation;
  handleHSize = '-4px';
  handleSize = '8px';
  cropRectStroke = '2px';
  outlineSize = '1000px';

  private movingHandle = -1;
  private lastPos: number[];

  constructor(private myElem: ElementRef<Element>, private sanitizer: DomSanitizer, private dimage: DiImageService,
              private editor: EditorService, private field: DiFieldService) {
    this.dataUpdated(this.field.data);
    field.fieldUpdated.subscribe((data: DiTransformedImage) => {
      this.dataUpdated(data);
    });
  }

  dataUpdated(data: DiTransformedImage) {
    this.data = data;
    this.image = (data == null) ? null : data.image;

    if (data != null && this.data.rot !== this.lastRotation) {
      // recalculate scale
      this.lastRotation = this.data.rot;
    }
  }

  ngOnInit() {
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

  getCanvasTransform(): SafeStyle {
    if (this.canvas == null) {
      return;
    }
    const container = this.canvas.nativeElement;

    const size = [window.innerWidth - 20, window.innerHeight - 20];

    if (!this.isPreview) {
      size[0] -= 201;
      size[1] -= 42;
    }

    const bounds = this.dimage.getRotatedBounds();
    const imageSize = this.isPreview ? [this.cropPx[2], this.cropPx[3]] : [bounds[2], bounds[3]];

    const transformCommands: string[] = [];

    const scale = Math.min(1, size[0] / imageSize[0], size[1] / imageSize[1]);
    this.handleHSize = (-4 / scale) + 'px';
    this.handleSize = (8 / scale) + 'px';
    this.cropRectStroke = (2 / scale) + 'px';
    this.outlineSize = (800 / scale) + 'px';
    this.scale = scale;
    transformCommands.push(`scale(${scale}, ${scale})`);

    // crop offset - in preview mode, offset the image to the middle
    if (this.isPreview) {
      const centerOff = [
        this.imageWidth / 2 - (this.cropPx[0] + this.cropPx[2] / 2),
        this.imageHeight / 2 - (this.cropPx[1] + this.cropPx[3] / 2),
      ];
      transformCommands.push(`translate(${centerOff[0]}px, ${centerOff[1]}px)`);
    }

    if (this.data.fliph || this.data.flipv) {
      transformCommands.push(`scale(${this.data.fliph ? -1 : 1}, ${this.data.flipv ? -1 : 1})`);
    }
    return this.sanitizer.bypassSecurityTrustStyle(transformCommands.join(' '));
  }

  getImageFilter(): SafeStyle {
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
    return this.sanitizer.bypassSecurityTrustStyle(filterCommands.join(' '));
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
    this.lastPos = null;
  }

  private getMousePosition(event: MouseEvent): number[] {
    const container = this.imageContainer.nativeElement;
    const ctrx = event.clientX - (container.offsetLeft + this.imageWidth / 2);
    const ctry = event.clientY - (container.offsetTop + this.imageHeight / 2);

    const scalex = (this.data.fliph ? -1 : 1) / this.scale;
    const scaley = (this.data.flipv ? -1 : 1) / this.scale;

    const localx = ctrx * scalex + this.imageWidth / 2;
    const localy = ctry * scaley + this.imageHeight / 2;
    return [localx, localy];
  }

  private clampCrop(clamp: number[]) {
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
    if (this.editor.previewMode !== PreviewMode.EditCrop) {
      return;
    }
    this.movingHandle = handle;
    const moveEvent = this.moveHandle.bind(this);
    this.bindMouseEvent(moveEvent, this.upHandle.bind(this));
  }

  grabPOI() {
    if (this.editor.previewMode !== PreviewMode.POI) {
      return;
    }
    const moveEvent = this.movePOI.bind(this);
    this.bindMouseEvent(moveEvent, this.upHandle.bind(this));
  }

  private bindMouseEvent(moveEvent, upHandle) {
    let upEvent;
    upEvent = (event: MouseEvent) => {
      this.myElem.nativeElement.removeEventListener('mousemove', moveEvent);
      this.myElem.nativeElement.removeEventListener('mouseup', upEvent);
      upHandle(event);
    };
    this.myElem.nativeElement.addEventListener('mousemove', moveEvent);
    this.myElem.nativeElement.addEventListener('mouseup', upEvent);
  }
}
