import { Component, OnInit } from '@angular/core'
import { NsdetailsComponent } from '../nsdetails/nsdetails.component'

@Component({
  selector: 'app-nsnotices',
  templateUrl: './nsnotices.component.html',
  styleUrls: ['./nsnotices.component.css']
})
export class NsnoticesComponent implements OnInit {

  constructor(
    public nsdetails: NsdetailsComponent
  ) { }

  ngOnInit() {
  }

}
