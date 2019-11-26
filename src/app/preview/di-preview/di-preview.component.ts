import { Component, OnInit } from '@angular/core';
import { DiFieldService } from 'src/app/editor/di-field.service';
import { DiPreviewService, DiPreviewImage } from 'src/app/editor/di-preview.service';

@Component({
  selector: 'amp-di-preview',
  templateUrl: './di-preview.component.html',
  styleUrls: ['./di-preview.component.scss']
})
export class DiPreviewComponent implements OnInit {

  constructor(public preview: DiPreviewService) { }

  ngOnInit() {
  }

  imageError(event: Event, item: DiPreviewImage) {
    item.error = 'Not available.';
  }
}
