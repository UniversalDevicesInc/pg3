import { TestBed, inject } from '@angular/core/testing';

import { AddnodeService } from './addnode.service';

describe('AddnodeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AddnodeService]
    });
  });

  it('should be created', inject([AddnodeService], (service: AddnodeService) => {
    expect(service).toBeTruthy();
  }));
});
