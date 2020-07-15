import { Injectable } from '@angular/core';

import { Param } from '../components/params/param';

@Injectable()
export class ValidateparamsService {

  params: Param[] = Array<Param>();

  constructor() { }

  addParam(param: Param) {
    this.params.push(param);
  }

  validate(): boolean {
    let isValid = true;

    for (const param of this.params) {
        if (!param.validate()) {
            isValid = false;
        }
    }

    return isValid;
  }
}
