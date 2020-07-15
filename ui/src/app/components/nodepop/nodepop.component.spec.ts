import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NodepopComponent } from './nodepop.component';

describe('NodepopComponent', () => {
  let component: NodepopComponent;
  let fixture: ComponentFixture<NodepopComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodepopComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodepopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
