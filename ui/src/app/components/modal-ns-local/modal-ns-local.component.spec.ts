import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalNsLocalComponent } from './modal-ns-local.component';

describe('ModalNsLocalComponent', () => {
  let component: ModalNsLocalComponent;
  let fixture: ComponentFixture<ModalNsLocalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalNsLocalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalNsLocalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
