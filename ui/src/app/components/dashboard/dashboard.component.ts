import { Component, OnInit, OnDestroy } from '@angular/core'
import { WebsocketsService } from '../../services/websockets.service'
import { AddnodeService } from '../../services/addnode.service'
import { FlashMessagesService } from 'angular2-flash-messages'
import { NodeServer } from '../../models/nodeserver.model'
import { Router } from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { ConfirmComponent } from '../confirm/confirm.component'
import { NodepopComponent } from '../nodepop/nodepop.component'
import { SettingsService } from '../../services/settings.service'
import { Subscription } from 'rxjs'

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
  public mqttConnected: boolean = false
  private subConnected: any
  private subSettings: any
  private subNodeServers: any
  private subResponses: any


  constructor(
    private sockets: WebsocketsService,
    private flashMessage: FlashMessagesService,
    private addNodeService: AddnodeService,
    private modal: NgbModal,
    private router: Router,
    private settingsService: SettingsService
  ) {
    this.subscription.add(this.sockets.mqttConnected.subscribe(connected => {
      this.mqttConnected = connected
    }))

    this.subscription.add(this.sockets.settingsData.subscribe(settings => {
      this.addNodeService.getPolyglotVersion()
      this.isyConnected = settings.isyConnected
      this.isyFound = settings.isyFound
      this.isyHttps = settings.isyHttps
      this.isyHost = settings.isyHost
      this.isyPort = settings.isyPort
      this.gotSettings = true
    }))

    this.subscription.add(this.sockets.nodeServerData.subscribe(nodeServers => {
      nodeServers.sort((a, b) => {
        return parseInt(a.profileNum, 10) - parseInt(b.profileNum, 10)
      })
      this.nodeServers = nodeServers
      if (this.selectedNode) {
        for (const i in this.nodeServers) {
          if (this.nodeServers[i].profileNum === this.selectedNode.profileNum) {
            this.selectedNode = this.nodeServers[i]
          }
        }
      }
    }))

    this.subscription.add(this.sockets.nodeServerResponse.subscribe(response => {
      if (response.hasOwnProperty('success')) {
        if (response.success) {
          this.flashMessage.show(response.msg, {
            cssClass: 'alert-success',
            timeout: 5000})
          window.scrollTo(0, 0)
        } else {
          this.flashMessage.show(response.msg, {
            cssClass: 'alert-danger',
            timeout: 5000})
          window.scrollTo(0, 0)
        }
      }
    }))

  }

  ngOnInit() {
    this.addNodeService.getPolyglotVersion()
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  deleteNodeServer(nodeServer) {
    this.sockets.sendMessage('nodeservers', {delns: {profileNum: nodeServer.profileNum}}, false, true)
  }

  showConfirm(nodeServer) {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = 'Delete NodeServer'
    modalRef.componentInstance.body = `This will delete the ${nodeServer.name} NodeServer. You will need to restart the ISY admin console to reflect the changes, if you are still having problems, click on 'Reboot ISY' above. Are you sure you want to delete?`
    modalRef.result.then((isConfirmed) => {
      if (isConfirmed)
        if (this.mqttConnected)
          this.deleteNodeServer(nodeServer)
        else
          this.showDisconnected()
    }).catch((error) => {})
  }

  showNodes(nodeServer) {
    if (this.selectedNode === nodeServer) { return this.selectedNode = null}
    if (nodeServer.nodes.length === 0) {
      this.flashMessage.show('This NodeServer has no nodes defined.', {
        cssClass: 'alert-danger',
        timeout: 3000})
      return window.scrollTo(0, 0)
    }
    this.selectedNode = nodeServer
  }

  showDisconnected() {
    this.flashMessage.show('Error not connected to Polyglot.', {
      cssClass: 'alert-danger',
      timeout: 3000})
  }

  redirect(profileNum) {
    //this.settingsService.currentNode = profileNum
    this.router.navigate(['/nsdetails', profileNum])
  }

}
