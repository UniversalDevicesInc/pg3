import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalNsAddComponent } from './modal-ns-add.component';

describe('ModalNsAddComponent', () => {
  let component: ModalNsAddComponent;
  let fixture: ComponentFixture<ModalNsAddComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalNsAddComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalNsAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
