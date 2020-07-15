import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalNsUpdateComponent } from './modal-ns-update.component';

describe('ModalNsUpdateComponent', () => {
  let component: ModalNsUpdateComponent;
  let fixture: ComponentFixture<ModalNsUpdateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModalNsUpdateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalNsUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
