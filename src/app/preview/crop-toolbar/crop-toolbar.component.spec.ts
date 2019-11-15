import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CropToolbarComponent } from './crop-toolbar.component';

describe('CropToolbarComponent', () => {
  let component: CropToolbarComponent;
  let fixture: ComponentFixture<CropToolbarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CropToolbarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CropToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
