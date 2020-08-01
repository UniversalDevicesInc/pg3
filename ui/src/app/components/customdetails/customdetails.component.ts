import { Component, OnInit, OnDestroy, QueryList, ViewChildren } from '@angular/core'

//import { CustomparamComponent } from '../params/customparam/customparam.component'
import { NsdetailsComponent } from '../nsdetails/nsdetails.component'
import { WebsocketsService } from '../../services/websockets.service'
import { SettingsService } from '../../services/settings.service'
import { ValidateparamsService } from '../../services/validateparams.service'

@Component({
  selector: 'app-customdetails',
  templateUrl: './customdetails.component.html',
  styleUrls: ['./customdetails.component.css']
})
export class CustomdetailsComponent implements OnInit, OnDestroy {
  helpCollapsed = false

  constructor(
    public nsdetails: NsdetailsComponent,
    private params: ValidateparamsService,
    public settings: SettingsService,
    public sockets: WebsocketsService
  ) {}

  ngOnInit() {}

  ngOnDestroy(): void {}
}
