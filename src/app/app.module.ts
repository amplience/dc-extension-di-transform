import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule, MatIconModule, MatMenuModule, MatSliderModule, MatFormFieldModule, MatSlideToggleModule, MatInputModule, MatTableModule, MatTooltipModule, MatDividerModule } from '@angular/material';
import { PreviewCanvasComponent } from './preview/preview-canvas/preview-canvas.component';
import { DiPreviewComponent } from './preview/di-preview/di-preview.component';
import { ModeButtonsComponent } from './preview/mode-buttons/mode-buttons.component';
import { EditToolbarComponent } from './preview/edit-toolbar/edit-toolbar.component';
import { FormsModule } from '@angular/forms';
import { TransformListComponent } from './metadata/transform-list/transform-list.component';
import { HttpClientModule } from '@angular/common/http';
import { CropToolbarComponent } from './preview/crop-toolbar/crop-toolbar.component';
import { SpinnerComponent } from './preview/spinner/spinner.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SimplebarAngularModule } from 'simplebar-angular';

@NgModule({
  declarations: [
    AppComponent,
    PreviewCanvasComponent,
    DiPreviewComponent,
    ModeButtonsComponent,
    EditToolbarComponent,
    TransformListComponent,
    CropToolbarComponent,
    SpinnerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSliderModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    FormsModule,
    MatInputModule,
    MatTableModule,
    MatTooltipModule,
    MatDividerModule,
    HttpClientModule,
    FlexLayoutModule,
    SimplebarAngularModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
