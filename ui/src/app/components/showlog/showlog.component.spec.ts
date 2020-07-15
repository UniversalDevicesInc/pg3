import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowlogComponent } from './showlog.component';

describe('ShowlogComponent', () => {
  let component: ShowlogComponent;
  let fixture: ComponentFixture<ShowlogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShowlogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
