import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomparamComponent } from './customparam.component';

describe('CustomparamComponent', () => {
  let component: CustomparamComponent;
  let fixture: ComponentFixture<CustomparamComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomparamComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomparamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
