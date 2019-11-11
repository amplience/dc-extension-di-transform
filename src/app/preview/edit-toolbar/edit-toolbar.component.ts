import { Component, OnInit, ViewChild } from '@angular/core';
import { DiFieldService } from 'src/app/editor/di-field.service';
import { DiEditField, DiEditModeButton, DiEditListItem, DiEditSlider } from 'src/app/editor/di-edit-slider';
import { EditorService, PreviewMode } from 'src/app/editor/editor.service';
import { MatMenuTrigger } from '@angular/material';

@Component({
  selector: 'amp-edit-toolbar',
  templateUrl: './edit-toolbar.component.html',
  styleUrls: ['./edit-toolbar.component.scss']
})
export class EditToolbarComponent implements OnInit {

  buttons: DiEditModeButton[];
  activeSliders: DiEditField[] = [];
  @ViewChild('cropMenuTrigger', {read: MatMenuTrigger, static: true}) cropMenuTrigger: MatMenuTrigger;

  get crop(): number[] {
    return this.field.data == null ? [0, 0, 0, 0] : this.field.data.crop;
  }

  set crop(value: number[]) {
    this.field.data.crop = value;
  }

  editButtons = [
    new DiEditModeButton('crop', 'Crop', [
      {type: 'listItem', name: 'Clear', field: 'aspectLock', value: '', action: () => this.clearCrop()},
      {type: 'listItem', name: 'Custom', field: 'aspectLock', value: 'none', action: () => this.showCropMenu()},
      {type: 'listItem', name: 'Square', field: 'aspectLock', value: '1:1'},
      {type: 'listItem', name: '16:9', field: 'aspectLock', value: '16:9'},
      {type: 'listItem', name: '4:3', field: 'aspectLock', value: '4:3'},
      {type: 'listItem', name: '3:2', field: 'aspectLock', value: '3:2'},
      {type: 'listItem', name: '2:3', field: 'aspectLock', value: '2:3'},
    ] as DiEditListItem[]),
    new DiEditModeButton('rotate', 'Rotate', [
      {type: 'slider', name: 'Rotation (degrees)', field: 'rot', min: 0, max: 360}
    ] as DiEditSlider[]),
    new DiEditModeButton('flip', 'Flip', [
      {type: 'bool', name: 'Horizontal', field: 'fliph'},
      {type: 'bool', name: 'Vertical', field: 'flipv'}
    ]),
    new DiEditModeButton('hsb', 'HSB', [
      {type: 'slider', name: 'Hue (degrees)', field: 'hue', min: -180, max: 180},
      {type: 'slider', name: 'Saturation', field: 'sat', min: -100, max: 100},
      {type: 'slider', name: 'Brightness', field: 'bri', min: -100, max: 100}
    ] as DiEditSlider[])
  ];

  poiButtons = [
    new DiEditModeButton('poi', 'POI', []),
  ];

  constructor(private field: DiFieldService, public editor: EditorService) {
    this.modeChanged();
    editor.modeChange.subscribe((mode) => {
      this.modeChanged();
    });
  }

  modeChanged() {
    switch (this.editor.previewMode) {
      default:
        this.buttons = this.editButtons;
        break;
    }
  }

  ngOnInit() {
  }

  updateSliderValue(slider: DiEditSlider, value: number) {
    this.field.updateSliderValue(slider, value);
  }

  getSliderValue(slider: DiEditSlider): number {
    return this.field.getSliderValue(slider);
  }

  exitMode(rollback: boolean) {
    if (rollback) {
      this.editor.cancelChanges();
    }
    this.editor.modeRequest('view');
  }

  setMode(button: DiEditModeButton) {
    if (this.editor.previewMode !== PreviewMode.EditCrop) {
      this.editor.modeRequest('edit');
    }
    this.editor.mode = button.mode;
    this.activeSliders = button.sliders;
  }

  resetTransforms() {
    this.field.resetDefault();
  }

  clearCrop() {
    this.field.data.crop = [0, 0, 0, 0];
    this.field.data.aspectLock = 'none';
    this.field.updateField();
  }

  poiMode() {
    if (this.editor.previewMode !== PreviewMode.POI) {
      this.editor.modeRequest('poi');
    }
    this.editor.mode = 'poi';
  }

  showCropMenu() {
    this.cropMenuTrigger.openMenu();
  }
}
