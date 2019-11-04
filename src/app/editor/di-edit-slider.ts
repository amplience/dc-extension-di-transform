export type DiEditMode = 'crop' | 'scale' | 'rotate' | 'flip' | 'hsb' | 'focal' | 'hotspot' | 'poi';

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
}

export class DiEditModeButton {
  mode: DiEditMode;
  name: string;
  sliders: DiEditField[];
  constructor(mode: DiEditMode, name: string, sliders: DiEditField[]) {
    this.mode = mode;
    this.name = name;
    this.sliders = sliders;
  }
}
