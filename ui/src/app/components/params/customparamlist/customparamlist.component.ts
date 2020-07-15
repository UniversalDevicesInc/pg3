import { Component, Input, OnInit } from '@angular/core';

import { Param } from '../param';
import { ParamInput } from '../paraminput';
import { ValidateparamsService } from '../../../services/validateparams.service';

@Component({
  selector: 'app-customparamlist',
  templateUrl: './customparamlist.component.html',
  styleUrls: ['./customparamlist.component.css']
})

export class CustomparamlistComponent extends Param implements OnInit {

  @Input() desc: ParamInput;
  @Input() data: any;
  items: any;
  errorMessages = Array<string>();
  errorClasses = Array<string>();

  trackByIndex = (index: any, item: any) => index;

  constructor(private params: ValidateparamsService) {
    super();
    params.addParam(this);
  }

  ngOnInit() {
    if (this.data[this.desc.name] == null) {
      this.data[this.desc.name] = this.items = [];
    } else {
      this.items = this.data[this.desc.name];
    }
  }

  addItem() {
    this.items.push(this.desc.defaultValue == null ? '' : this.desc.defaultValue);
    this.errorMessages.push(null);
    this.errorClasses.push('');
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
    this.errorMessages.splice(index, 1);
    this.errorClasses.splice(index, 1);
  }

  validate(): boolean {
    let isValid = true;
    let itemValid: boolean;
    for (const index of Object.keys(this.items)) {
      [ itemValid, this.items[index], this.errorMessages[index] ]
        = this.valudateValue(this.desc, this.items[index]);
      if (!itemValid) {
        isValid = false;
        this.errorClasses[index] = 'has-error'
      } else {
        this.errorClasses[index] = ''
      }
    }

    return isValid;
  }

}
