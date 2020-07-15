import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverpopComponent } from './driverpop.component';

describe('DriverpopComponent', () => {
  let component: DriverpopComponent;
  let fixture: ComponentFixture<DriverpopComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DriverpopComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverpopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
