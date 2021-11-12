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
  title: string;
  data: DiTransformedImage;

  get showToolbar(): boolean {
    return this.editor.previewMode !== PreviewMode.View;
  }

  constructor(private sdkService: DcSdkService, private editor: EditorService, private icons: MatIconRegistry,
              private sanitizer: DomSanitizer) {
    icons.addSvgIcon('delete', sanitizer.bypassSecurityTrustResourceUrl('./assets/icons/ic-asset-delete.svg'));

    sdkService.getSDK().then((sdk) => {
      const params = { ...sdk.params.installation, ...sdk.params.instance };

      this.title = (params as any).title || sdk.field.schema.title;
    });
  }
}
