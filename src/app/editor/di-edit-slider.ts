import { PreviewMode } from './editor.service';

export interface DiEditField {
  type: string;
  name: string;
  field: string;
}

export interface DiEditSlider extends DiEditField {
  type: 'slider';
  min: number;
  max: number;
}

export interface DiEditBoolean extends DiEditField {
  type: 'bool';
}

export interface DiEditListItem extends DiEditField {
  type: 'listItem';
  value: string;
  iconSVG: string;
  action?: (DiEditListItem) => void;
}

export class DiEditModeButton {
  mode: PreviewMode;
  name: string;
  sliders: DiEditField[];
  constructor(mode: PreviewMode, name: string, sliders: DiEditField[]) {
    this.mode = mode;
    this.name = name;
    this.sliders = sliders;
  }
}
