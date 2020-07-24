import { Component, OnInit } from '@angular/core'
import { NsdetailsComponent } from '../nsdetails/nsdetails.component'
import { SettingsService } from '../../services/settings.service'

@Component({
  selector: 'app-nodedetails',
  templateUrl: './nodedetails.component.html',
  styleUrls: ['./nodedetails.component.css']
})
export class NodedetailsComponent implements OnInit {
  objectKeys = Object.keys
  selectedRow: any
  constructor(public nsdetails: NsdetailsComponent, public settings: SettingsService) {}

  ngOnInit() {}
}
