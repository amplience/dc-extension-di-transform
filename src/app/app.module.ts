import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatIconModule, MatMenuModule, MatSliderModule, MatFormFieldModule, MatSlideToggleModule } from '@angular/material';
import { PreviewCanvasComponent } from './preview/preview-canvas/preview-canvas.component';
import { DiPreviewComponent } from './preview/di-preview/di-preview.component';
import { ModeButtonsComponent } from './preview/mode-buttons/mode-buttons.component';
import { EditToolbarComponent } from './preview/edit-toolbar/edit-toolbar.component';

@NgModule({
  declarations: [
    AppComponent,
    PreviewCanvasComponent,
    DiPreviewComponent,
    ModeButtonsComponent,
    EditToolbarComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSliderModule,
    MatFormFieldModule,
    MatSlideToggleModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
