import { Component } from '@angular/core';
import { DcSdkService } from './api/dc-sdk.service';
import { MediaImageLink } from 'dc-extensions-sdk';
import { DiTransformedImage } from './model/di-transformed-image';
import { EditorService, PreviewMode } from './editor/editor.service';
import { MatIconRegistry } from '@angular/material';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'amp-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'dc-uiex-di';
  data: DiTransformedImage;

  get showToolbar(): boolean {
    return this.editor.previewMode !== PreviewMode.View;
  }

  constructor(private sdkService: DcSdkService, private editor: EditorService, private icons: MatIconRegistry,
              private sanitizer: DomSanitizer) {
    icons.addSvgIcon('delete', sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/ic-asset-delete.svg'));
  }
}
