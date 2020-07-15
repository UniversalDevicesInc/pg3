import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PolisyconfComponent } from './polisyconf.component';

describe('PolisyconfComponent', () => {
  let component: PolisyconfComponent;
  let fixture: ComponentFixture<PolisyconfComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PolisyconfComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PolisyconfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
