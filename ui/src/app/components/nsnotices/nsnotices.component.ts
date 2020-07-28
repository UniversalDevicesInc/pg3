import { Component, OnInit } from '@angular/core'
import { NsdetailsComponent } from '../nsdetails/nsdetails.component'
import { SettingsService } from '../../services/settings.service'
import { WebsocketsService } from '../../services/websockets.service'
import {
  faAngleDoubleDown,
  faAngleDoubleUp,
  faWindowClose
} from '@fortawesome/free-solid-svg-icons'

@Component({
  selector: 'app-nsnotices',
  templateUrl: './nsnotices.component.html',
  styleUrls: ['./nsnotices.component.css']
})
export class NsnoticesComponent implements OnInit {
  constructor(
    public nsdetails: NsdetailsComponent,
    public settings: SettingsService,
    private sockets: WebsocketsService
  ) {}

  faAngleDoubleDown = faAngleDoubleDown
  faAngleDoubleUp = faAngleDoubleUp
  faWindowClose = faWindowClose

  ngOnInit() {}

  async removeNotice(nodeServer, key) {
    const notices = nodeServer.notices
    delete notices[key]
    this.sockets.sendMessage('ns', {
      updateNotices: {
        uuid: this.settings.currentNs.value['uuid'],
        profileNum: this.settings.currentNs.value['profileNum'],
        notices
      }
    })
    console.log(`Removing notice ${key} from ${nodeServer.name}`)
  }
}
