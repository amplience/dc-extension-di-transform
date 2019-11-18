import { Component, OnInit } from '@angular/core';
import { DiFieldService } from 'src/app/editor/di-field.service';
import { DiImageService } from 'src/app/editor/di-image.service';

@Component({
  selector: 'amp-crop-toolbar',
  templateUrl: './crop-toolbar.component.html',
  styleUrls: ['./crop-toolbar.component.scss']
})
export class CropToolbarComponent implements OnInit {

  focus: boolean[] = [false, false, false, false];
  crop: number[] = [0, 0, 0, 0];

  constructor(private field: DiFieldService, private image: DiImageService) {
    this.readCrop();
    field.fieldUpdated.subscribe(data => {
      this.readCrop();
    });
  }

  ngOnInit() {
  }

  readCrop() {
    if (this.field.data == null) {
      this.crop = [0, 0, 0, 0];
    } else {
      this.crop = this.field.data.crop.slice(0);
    }
  }

  updateCrop(sizeUpdate: boolean) {
    // if position is changed, bound the position based on the size
    // if size is changed, do the opposite!
    const bounds = this.image.getRotatedBounds();
    const crop = this.crop;
    if (sizeUpdate) {
      // size is bounded to the crop bounds minus the position
      crop[2] = Math.max(1, Math.min(crop[2], (bounds[0] + bounds[2]) - crop[0]));
      crop[3] = Math.max(1, Math.min(crop[3], (bounds[1] + bounds[3]) - crop[1]));
    } else {
      // location is bounded to the crop bounds minus the size
      crop[0] = Math.max(bounds[0], Math.min(crop[0], bounds[2] - crop[2]));
      crop[1] = Math.max(bounds[1], Math.min(crop[1], bounds[3] - crop[3]));
    }

    this.field.data.crop = crop.slice(0);
    this.field.updateField();
  }

}
