import { Component, ElementRef, Input, OnInit } from '@angular/core';

import { CustomparamlistComponent } from '../customparamlist/customparamlist.component';
import { CustomparamsetComponent } from '../customparamset/customparamset.component';
import { Param } from '../param';
import { ParamInput } from '../paraminput';
import { ValidateparamsService } from '../../../services/validateparams.service';

@Component({
  selector: '[app-customparam]',
  templateUrl: './customparam.component.html',
  styleUrls: ['./customparam.component.css']
})

export class CustomparamComponent extends Param implements OnInit {

  @Input() desc: ParamInput;
  @Input() data: any;
  errorMessage: string;

  constructor(private parent: ElementRef,
    private params: ValidateparamsService) {
    super();
    params.addParam(this);
  }

  ngOnInit() {
    if (this.data[this.desc.name] == null) {
        this.data[this.desc.name] = this.desc.defaultValue;
    }
  }

  validate(): boolean {
    if (this.desc.isList || this.desc.params != null) {
      return true;
    }
    this.parent.nativeElement.classList.remove('has-error');
    let isValid: boolean;
    [ isValid, this.data[this.desc.name], this.errorMessage]
        = this.valudateValue(this.desc, this.data[this.desc.name]);
    if (!isValid) {
      this.parent.nativeElement.classList.add('has-error');
    }

    return isValid;
  }
}
