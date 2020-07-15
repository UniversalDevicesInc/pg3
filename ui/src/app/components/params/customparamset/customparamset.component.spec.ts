import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomparamsetComponent } from './customparamset.component';

describe('CustomparamsetComponent', () => {
  let component: CustomparamsetComponent;
  let fixture: ComponentFixture<CustomparamsetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomparamsetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomparamsetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
