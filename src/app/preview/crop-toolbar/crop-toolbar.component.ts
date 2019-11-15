import { Component, OnInit } from '@angular/core';
import { DiFieldService } from 'src/app/editor/di-field.service';

@Component({
  selector: 'amp-crop-toolbar',
  templateUrl: './crop-toolbar.component.html',
  styleUrls: ['./crop-toolbar.component.scss']
})
export class CropToolbarComponent implements OnInit {

  focus: boolean[] = [false, false, false, false];

  get crop(): number[] {
    return this.field.data == null ? [0, 0, 0, 0] : this.field.data.crop;
  }

  set crop(value: number[]) {
    this.field.data.crop = value;
  }

  constructor(private field: DiFieldService) { }

  ngOnInit() {
  }

  updateCrop() {
    this.field.updateField();
  }

}
