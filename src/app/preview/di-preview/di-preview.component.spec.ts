import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiPreviewComponent } from './di-preview.component';

describe('DiPreviewComponent', () => {
  let component: DiPreviewComponent;
  let fixture: ComponentFixture<DiPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
