import { Component, OnInit, OnChanges, ViewChildren, QueryList, ElementRef, AfterViewChecked } from '@angular/core';
import { DiPreviewService } from 'src/app/editor/di-preview.service';

@Component({
  selector: 'amp-di-preview',
  templateUrl: './di-preview.component.html',
  styleUrls: ['./di-preview.component.scss']
})
export class DiPreviewComponent implements OnInit, OnChanges, AfterViewChecked {

  @ViewChildren('imageContainer') imageContainers: QueryList<ElementRef<HTMLDivElement>>;

  constructor(public preview: DiPreviewService) {
    this.preview.previewLoaded.subscribe(item => {
      this.updateContainers();
    });
  }

  ngOnInit() {
  }

  ngAfterViewChecked() {
    this.updateContainers();
  }

  ngOnChanges(changes) {
    this.updateContainers();
  }

  updateContainers() {
    let previews = this.preview.previews;
    if (previews == null) {
      previews = [];
    }
    const elems = this.imageContainers.toArray();
    for (let i = 0; i < previews.length; i++) {
      const preview = previews[i];
      const elem = elems[i].nativeElement;

      // make sure the elem contains only the latest preview
      const img = preview.preferredImage();
      if (img === null) {
        const toRemove = Array.from(elem.children).filter(child => child.tagName === 'IMG');
        toRemove.forEach(remove => elem.removeChild(remove));
        elem.textContent = preview.error;
      } else {
        if (elem.firstChild !== img || elem.children.length !== 1) {
          while (elem.lastChild) {
            elem.removeChild(elem.lastChild);
          }
          elem.appendChild(img);
        }
      }
    }
  }
}
