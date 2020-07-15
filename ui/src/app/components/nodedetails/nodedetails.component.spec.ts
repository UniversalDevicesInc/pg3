import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodedetailsComponent } from './nodedetails.component';

describe('NodedetailsComponent', () => {
  let component: NodedetailsComponent;
  let fixture: ComponentFixture<NodedetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodedetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodedetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
