import { Component, OnInit } from '@angular/core';
import { DiFieldService } from 'src/app/editor/di-field.service';
import { DIEditSlider, DIEditModeButton } from 'src/app/editor/di-edit-slider';
import { EditorService, PreviewMode } from 'src/app/editor/editor.service';

@Component({
  selector: 'amp-edit-toolbar',
  templateUrl: './edit-toolbar.component.html',
  styleUrls: ['./edit-toolbar.component.scss']
})
export class EditToolbarComponent implements OnInit {

  buttons: DIEditModeButton[];
  activeSliders: DIEditSlider[] = [];

  editButtons = [
    new DIEditModeButton('crop', 'Crop', []),
    new DIEditModeButton('rotate', 'Rotate', [{name: 'Rotation (degrees)', field: 'rot', min: 0, max: 360}]),
    new DIEditModeButton('flip', 'Flip', [
      {name: 'Horizontal', field: 'fliph', bool: true},
      {name: 'Vertical', field: 'flipv', bool: true}
    ]),
    new DIEditModeButton('hsb', 'HSB', [
      {name: 'Hue (degrees)', field: 'hue', min: -180, max: 180},
      {name: 'Saturation', field: 'sat', min: -100, max: 100},
      {name: 'Brightness', field: 'bri', min: -100, max: 100}
    ])
  ];

  poiButtons = [
    new DIEditModeButton('poi', 'POI', []),
  ];

  constructor(private field: DiFieldService, public editor: EditorService) {
    this.modeChanged();
    editor.modeChange.subscribe((mode) => {
      this.modeChanged();
    });
  }

  modeChanged() {
    switch (this.editor.previewMode) {
      case PreviewMode.POI:
        this.buttons = this.poiButtons;
        break;
      case PreviewMode.View:
        this.buttons = [];
        break;
      default:
        this.buttons = this.editButtons;
        break;
    }
  }

  ngOnInit() {
  }

  updateSliderValue(slider: DIEditSlider, value: number) {
    this.field.updateSliderValue(slider, value);
  }

  getSliderValue(slider: DIEditSlider): number {
    return this.field.getSliderValue(slider);
  }

  exitMode(rollback: boolean) {
    this.editor.previewMode = PreviewMode.View;
  }

  setMode(button: DIEditModeButton) {
    this.editor.mode = button.mode;
    this.activeSliders = button.sliders;
  }

}
