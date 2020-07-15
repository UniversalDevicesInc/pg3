import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-driverpop',
  templateUrl: './driverpop.component.html',
  styleUrls: ['./driverpop.component.css']
})
export class DriverpopComponent {
  objectKeys = Object.keys
  @Input() drivers: any
  @Input() selectedNode: any
  constructor() { }


}
