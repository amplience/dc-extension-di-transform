import { Component, OnInit } from '@angular/core';
import { DiPreviewService, DiTransformationSegment } from 'src/app/editor/di-preview.service';
import { DiFieldService } from 'src/app/editor/di-field.service';

@Component({
  selector: 'amp-transform-list',
  templateUrl: './transform-list.component.html',
  styleUrls: ['./transform-list.component.scss']
})
export class TransformListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'query', 'fields'];

  constructor(public di: DiPreviewService, private field: DiFieldService) { }

  ngOnInit() {
  }

  clearTransform(transformation: DiTransformationSegment) {
    const data = this.field.data;
    for (let i = 0; i < transformation.fields.length; i++) {
      if (transformation.defaults && transformation.defaults[i] !== undefined) {
        data[transformation.fields[i]] = transformation.defaults[i];
      } else {
        data[transformation.fields[i]] = 0;
      }
    }
    this.field.updateField();
    this.di.updateDiPreview();
  }
}
