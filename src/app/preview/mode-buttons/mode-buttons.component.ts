import { Component, OnInit, Input, HostBinding, Host } from '@angular/core';
import { DiFieldService } from 'src/app/editor/di-field.service';
import { EditorService, PreviewMode } from 'src/app/editor/editor.service';

@Component({
  selector: 'amp-mode-buttons',
  templateUrl: './mode-buttons.component.html',
  styleUrls: ['./mode-buttons.component.scss']
})
export class ModeButtonsComponent implements OnInit {

  @HostBinding('class.amp-mode-buttons__hide') hidden: boolean;
  hasImage: boolean;
  get showButtons(): boolean {
    return this.editor.previewMode === PreviewMode.View;
  }

  constructor(private field: DiFieldService, private editor: EditorService) {
    this.updateData();
    field.fieldUpdated.subscribe(data => {
      this.updateData();
    });
    editor.modeChange.subscribe(mode => {
      this.hidden = !this.showButtons;
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
