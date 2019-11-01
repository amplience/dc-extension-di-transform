import { Component, OnInit, Input } from '@angular/core';
import { DiFieldService } from 'src/app/editor/di-field.service';
import { EditorService, PreviewMode } from 'src/app/editor/editor.service';

@Component({
  selector: 'amp-mode-buttons',
  templateUrl: './mode-buttons.component.html',
  styleUrls: ['./mode-buttons.component.scss']
})
export class ModeButtonsComponent implements OnInit {

  hasImage: boolean;
  get showButtons(): boolean {
    return this.editor.previewMode === PreviewMode.View;
  }

  constructor(private field: DiFieldService, private editor: EditorService) {
    this.updateData();
    field.fieldUpdated.subscribe(data => {
      this.updateData();
    });
  }

  updateData() {
    const data = this.field.data;
    this.hasImage = data != null && data.image != null && data.image.name !== '';
  }

  ngOnInit() {
  }

  changeMode(mode: string) {
    this.editor.modeRequest(mode);
  }

}
