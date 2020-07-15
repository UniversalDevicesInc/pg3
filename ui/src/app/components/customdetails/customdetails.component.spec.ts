import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomdetailsComponent } from './customdetails.component';

describe('CustomdetailsComponent', () => {
  let component: CustomdetailsComponent;
  let fixture: ComponentFixture<CustomdetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomdetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
