import { Component, OnInit, OnDestroy } from '@angular/core'
import { ValidateService } from '../../services/validate.service'
import { AddnodeService } from '../../services/addnode.service'
import { WebsocketsService } from '../../services/websockets.service'
import { NodeServer } from '../../models/nodeserver.model'
import { FlashMessagesService } from 'angular2-flash-messages'
import { DashboardComponent } from '../dashboard/dashboard.component'
import { Router } from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { ConfirmComponent } from '../confirm/confirm.component'


@Component({
  selector: 'app-addnode',
  templateUrl: './addnode.component.html',
  styleUrls: ['./addnode.component.css']
})
export class AddnodeComponent implements OnInit, OnDestroy {
  name: string
  profileNum: number
  baseUrl: String
  nodeServers: NodeServer[]

  public mqttConnected = false
  private subConnected: any
  private subNodeServers: any
  private subNsTypes: any
  public nsTypes: string[] = []
  public indexes: number[] = Array.from({ length: 25 }, (value, key) => key + 1);
  public types: string[] = ['Local (Co-Resident with Polyglot)', 'Remote']
  public typeSet: string[] = ['local', 'remote']
  public received = false
  public selectedType: string = this.typeSet[0]
  public selectedNS: Object = this.nsTypes[0]

  constructor(
    private validateService: ValidateService,
    private flashMessage: FlashMessagesService,
    private modal: NgbModal,
    private addNodeService: AddnodeService,
    private sockets: WebsocketsService,
    private router: Router
  ) {}

  onSelect(index) {
    this.profileNum = index
  }

  onSelectType(index) {
    this.selectedType = this.typeSet[index]
  }

  onSelectNS(index) {
    this.selectedNS = this.nsTypes[index]
  }


  ngOnInit() {
    // if (!this.sockets.connected) this.sockets.start()
    this.getConnected()
    this.getNsTypes()
    this.getNodeServers()
  }

  ngOnDestroy() {
    if (this.subConnected) { this.subConnected.unsubscribe() }
    if (this.subNsTypes) { this.subNsTypes.unsubscribe() }
    if (this.subNodeServers) { this.subNodeServers.unsubscribe() }
  }

  getConnected() {
    this.subConnected = this.sockets.mqttConnected.subscribe(connected => {
      this.mqttConnected = connected
      if (connected) {
        this.sockets.sendMessage('nodeservers', { 'nodetypes': '' })
      }
    })
  }

  getNodeServers() {
    this.subNodeServers = this.sockets.nodeServerData.subscribe(nodeServers => {
      this.nodeServers = nodeServers
      this.nodeServers.forEach((ns) => {
        const ind = this.indexes.indexOf(parseInt(ns.profileNum, 10));
        if (ind > -1) {
          this.indexes.splice(ind, 1)
        }
      })
      this.profileNum = this.indexes[0]
    })
  }

  getNsTypes() {
    this.subNsTypes = this.sockets.nsTypeResponse.subscribe(nsTypes => {
      this.received = true
      this.nsTypes = nsTypes.notInUse
      this.selectedNS = this.nsTypes[0]
    })
  }

  showConfirm() {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = 'Add NodeServer'
    modalRef.componentInstance.body = `Typically it is only necessary to restart the admin console by
 closing and re-opening it. If this doesn't show your new NodeServer, use the
 Reboot ISY button on the navigation bar above.`
    modalRef.result.then((isConfirmed) => {
        this.onRegisterSubmit(isConfirmed)
    }).catch((error) => {})
  }

  showDisconnected() {
    this.flashMessage.show('Error not connected to Polyglot.', {
      cssClass: 'alert-danger',
      timeout: 3000})
  }

  onRegisterSubmit(confirmed) {
    if (!confirmed) { return }
    let name: string, path: string;
    if (!this.sockets.isyConnected) {
      this.flashMessage.show('ISY not connected to Polyglot. Can\'t add NodeServers.',
        { cssClass: 'alert-danger', timeout: 5000 });
      window.scrollTo(0, 0)
    } else {
      if (this.selectedType === 'local') {
        name = this.selectedNS['name']
        path = this.selectedNS['_folder']
      } else {
        name = this.name
      }
      const node = {
        name: name || this.name,
        profileNum: this.profileNum,
        type: this.selectedType,
        path: path || ''
      }
      if (!this.validateService.validateRegister(node)) {
        this.flashMessage.show('Please fill in all fields', {cssClass: 'alert-danger', timeout: 3000})
        return false
      }

      if (!this.validateService.validateProfileNum(node.profileNum)) {
        this.flashMessage.show('Please use 1 through 10 for Node Server Number.',
          {cssClass: 'alert-danger', timeout: 3000})
        return false
      }

      if (this.sockets.connected) {
        this.sockets.sendMessage('nodeservers', {addns: node}, false, true)
        this.flashMessage.show(`Successfully submitted ${node.type} NodeServer
 ${node.name} at slot ${node.profileNum}`,
          {cssClass: 'alert-success', timeout: 3000})
        window.scrollTo(0, 0)
        this.router.navigate(['/dashboard'])
      } else {
        this.flashMessage.show('Websockets not connected to Polyglot. Node not added.', {
          cssClass: 'alert-danger',
          timeout: 5000})
        window.scrollTo(0, 0)
      }
    }
  }
}
