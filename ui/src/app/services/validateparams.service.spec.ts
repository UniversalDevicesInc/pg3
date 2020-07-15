import { TestBed, inject } from '@angular/core/testing';

import { ValidateparamsService } from './validateparams.service';

describe('ValidateparamsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ValidateparamsService]
    });
  });

  it('should be created', inject([ValidateparamsService], (service: ValidateparamsService) => {
    expect(service).toBeTruthy();
  }));
});
