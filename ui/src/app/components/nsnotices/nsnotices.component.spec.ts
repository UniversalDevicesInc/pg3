import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NsnoticesComponent } from './nsnotices.component';

describe('NsnoticesComponent', () => {
  let component: NsnoticesComponent;
  let fixture: ComponentFixture<NsnoticesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NsnoticesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NsnoticesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
