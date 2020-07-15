import { Component, Input, OnInit } from '@angular/core';

import { ParamInput } from '../paraminput';

@Component({
  selector: 'app-customparamset',
  templateUrl: './customparamset.component.html',
  styleUrls: ['./customparamset.component.css']
})

export class CustomparamsetComponent implements OnInit {

  @Input() desc: ParamInput;
  @Input() data: any;
  items: any;

  constructor() { }

  ngOnInit() {
    if (this.data[this.desc.name] != null) {
      if (this.desc.isList) {
        this.items = this.data[this.desc.name];
      } else {
        this.items = [ this.data[this.desc.name] ];
      }
    } else {
      if (this.desc.isList) {
        this.data[this.desc.name] = this.items = [];
      } else {
        this.data[this.desc.name] = {};
        this.items = [ this.data[this.desc.name] ];
      }
    }
  }

  addItem() {
      this.items.push({});
  }

  removeItem(index: number) {
      this.items.splice(index, 1);
  }

}
