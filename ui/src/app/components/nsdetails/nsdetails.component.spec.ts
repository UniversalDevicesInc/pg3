import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NsdetailsComponent } from './nsdetails.component';

describe('NsdetailsComponent', () => {
  let component: NsdetailsComponent;
  let fixture: ComponentFixture<NsdetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NsdetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NsdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
