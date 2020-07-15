import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GetnsComponent } from './getns.component';

describe('GetnsComponent', () => {
  let component: GetnsComponent;
  let fixture: ComponentFixture<GetnsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GetnsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GetnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
