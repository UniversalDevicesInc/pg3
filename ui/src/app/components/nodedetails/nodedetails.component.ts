import { Component, OnInit } from '@angular/core';
import { NsdetailsComponent } from '../nsdetails/nsdetails.component'

@Component({
  selector: 'app-nodedetails',
  templateUrl: './nodedetails.component.html',
  styleUrls: ['./nodedetails.component.css']
})
export class NodedetailsComponent implements OnInit {

  objectKeys = Object.keys
  constructor(
    public nsdetails: NsdetailsComponent,
  ) { }

  ngOnInit() {
  }

}
