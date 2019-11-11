import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TransformListComponent } from './transform-list.component';

describe('TransformListComponent', () => {
  let component: TransformListComponent;
  let fixture: ComponentFixture<TransformListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TransformListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TransformListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
