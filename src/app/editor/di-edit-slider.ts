export type DIEditMode = 'crop' | 'scale' | 'rotate' | 'flip' | 'hsb' | 'focal' | 'hotspot' | 'poi';

export interface DIEditSlider {
  name: string;
  field: string;
  min?: number;
  max?: number;
  bool?: boolean;
}

export class DIEditModeButton {
  mode: DIEditMode;
  name: string;
  sliders: DIEditSlider[];
  constructor(mode: DIEditMode, name: string, sliders: DIEditSlider[]) {
    this.mode = mode;
    this.name = name;
    this.sliders = sliders;
  }
}
