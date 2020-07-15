import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomparamlistComponent } from './customparamlist.component';

describe('CustomparamlistComponent', () => {
  let component: CustomparamlistComponent;
  let fixture: ComponentFixture<CustomparamlistComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomparamlistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomparamlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
