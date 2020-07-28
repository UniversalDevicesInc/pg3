import { Component, OnInit, OnDestroy } from '@angular/core'
import { WebsocketsService } from '../../services/websockets.service'
import { AddnodeService } from '../../services/addnode.service'
import { NodeServer } from '../../models/nodeserver.model'
import { Router } from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { ConfirmComponent } from '../confirm/confirm.component'
import { NodepopComponent } from '../nodepop/nodepop.component'
import { SettingsService } from '../../services/settings.service'
import { Subscription } from 'rxjs'
import { ToastrService } from 'ngx-toastr'

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  nodeServers: NodeServer[]
  confirmResult: boolean = null
  nodeDetails: any = null
  selectedNode: any
  private subscription: Subscription = new Subscription()

  public objectValues = Object.values
  public objectKeys = Object.keys
  public isyFound: boolean
  public isyHttps: boolean
  public isyHost: string
  public isyPort: string
  public gotSettings: boolean
  public isyConnected: boolean
  private subConnected: any
  private subSettings: any
  private subNodeServers: any
  private subResponses: any

  constructor(
    public sockets: WebsocketsService,
    private addNodeService: AddnodeService,
    private modal: NgbModal,
    private router: Router,
    public settingsService: SettingsService,
    private toastr: ToastrService
  ) {
    // this.subscription.add(this.sockets.settingsData.subscribe(settings => {
    //   this.addNodeService.getPolyglotVersion()
    //   this.isyConnected = settings.isyConnected
    //   this.isyFound = settings.isyFound
    //   this.isyHttps = settings.isyHttps
    //   this.isyHost = settings.isyHost
    //   this.isyPort = settings.isyPort
    //   this.gotSettings = true
    // }))
    // this.subscription.add(this.sockets.nodeServerData.subscribe(nodeServers => {
    //   nodeServers.sort((a, b) => {
    //     return parseInt(a.profileNum, 10) - parseInt(b.profileNum, 10)
    //   })
    //   this.nodeServers = nodeServers
    //   if (this.selectedNode) {
    //     for (const i in this.nodeServers) {
    //       if (this.nodeServers[i].profileNum === this.selectedNode.profileNum) {
    //         this.selectedNode = this.nodeServers[i]
    //       }
    //     }
    //   }
    // }))
    // this.subscription.add(this.sockets.nodeServerResponse.subscribe(response => {
    //   if (response.hasOwnProperty('success')) {
    //     if (response.success) {
    //       this.flashMessage.show(response.msg, {
    //         cssClass: 'alert-success',
    //         timeout: 5000})
    //       window.scrollTo(0, 0)
    //     } else {
    //       this.flashMessage.show(response.msg, {
    //         cssClass: 'alert-danger',
    //         timeout: 5000})
    //       window.scrollTo(0, 0)
    //     }
    //   }
    // }))
  }

  ngOnInit() {
    if (this.settingsService.currentIsy.value)
      if (this.sockets.connected) {
        this.sockets.sendMessage('isy', {
          getNodeServers: { uuid: this.settingsService.currentIsy.value['uuid'] }
        })
      }
    // this.addNodeService.getPolyglotVersion()
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  deleteNodeServer(nodeServer) {
    this.sockets.sendMessage('isy', { removeNs: nodeServer }, false, false)
    this.toastr.success(
      `Removing NodeServer: ${nodeServer.name} from slot: ${nodeServer.profileNum}`
    )
  }

  showConfirm(nodeServer) {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = 'Delete NodeServer'
    modalRef.componentInstance.body = `This will delete the ${nodeServer.name} NodeServer. You will need to restart the ISY admin console to reflect the changes, if you are still having problems, click on 'Reboot ISY' above. Are you sure you want to delete?`
    modalRef.result
      .then(isConfirmed => {
        if (isConfirmed)
          if (this.sockets.connected) this.deleteNodeServer(nodeServer)
          else this.showDisconnected()
      })
      .catch(error => {})
  }

  showNodes(nodeServer) {
    if (this.selectedNode === nodeServer) {
      return (this.selectedNode = null)
    }
    if (nodeServer.nodeCount === 0) {
      this.toastr.error(`This NodeServer has no nodes defined.`)
      return window.scrollTo(0, 0)
    }
    this.selectedNode = nodeServer
  }

  showDisconnected() {
    this.toastr.error(`Not connected to Polyglot`)
  }

  redirect(uuid, profileNum) {
    //this.settingsService.currentNs = [uuid, profileNum]
    this.router.navigate(['/nsdetails', `${uuid}_${profileNum}`])
  }

  isArray(obj: any) {
    return Array.isArray(obj)
  }
}
