import { Component, OnInit, OnDestroy } from '@angular/core'
import { AddnodeService } from '../../services/addnode.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { ConfirmComponent } from '../confirm/confirm.component'
import { ModalNsUpdateComponent } from '../modal-ns-update/modal-ns-update.component'
import { ModalNsAddComponent } from '../modal-ns-add/modal-ns-add.component'
import { FlashMessagesService } from 'angular2-flash-messages'
import { SettingsService } from '../../services/settings.service'
import { WebsocketsService } from '../../services/websockets.service'
import _ from "lodash"

@Component({
  selector: 'app-getns',
  templateUrl: './getns.component.html',
  styleUrls: ['./getns.component.css']
})
export class GetnsComponent implements OnInit, OnDestroy {

  Math: any
  public mqttConnected: boolean = false
  private subConnected: any
  public nsList: any
  private subResponses: any
  public received: boolean = false
  private subNsTypes: any
  public installedTypes: any

  constructor(
    private addNodeService: AddnodeService,
    private sockets: WebsocketsService,
    private settingsService: SettingsService,
    private flashMessage: FlashMessagesService,
    private modal: NgbModal,
  ) { this.Math = Math }

  ngOnInit() {
    this.getConnected()
    this.getNSList()
    this.getNsTypes()
    this.getNodeServerResponses()
  }

  ngOnDestroy() {
    if (this.subConnected) { this.subConnected.unsubscribe() }
    if (this.subResponses) { this.subResponses.unsubscribe() }
    if (this.subNsTypes) { this.subNsTypes.unsubscribe() }
  }

  getConnected() {
    this.subConnected = this.sockets.mqttConnected.subscribe(connected => {
      this.mqttConnected = connected
      if (connected)
        this.sockets.sendMessage('nodeservers', { 'nodetypes': '' })
    })
  }

  getNSList() {
    this.addNodeService.getNSList().subscribe(nsList => {
      this.nsList = nsList
      this.received = true
    })
    this.flashMessage.show(`Refreshed NodeServers List from Server.`, {
      cssClass: 'alert-success',
      timeout: 3000})
  }

  getNodeServerResponses() {
    this.subResponses = this.sockets.nodeServerResponse.subscribe(response => {
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
    })
  }

  getNsTypes() {
    this.subNsTypes = this.sockets.nsTypeResponse.subscribe(nsTypes => {
      this.received = true
      this.installedTypes = nsTypes.installed
    })
  }

  addNS() {
    const modalRef = this.modal.open(ModalNsAddComponent, { centered: true })
    modalRef.componentInstance.title = 'Add NodeServer to Polyglot Repository'
    modalRef.componentInstance.body = `Please enter the Github repository link to submit to the Polyglot team for addition into the NodeServer Store.`
    modalRef.result.then((nslink) => {
        if (nslink) {
          this.addNodeService.submitNewNS(nslink).subscribe(response => {
            this.flashMessage.show(`Submitted new NodeServer for approval to the Polyglot team.`, {
              cssClass: 'alert-success',
              timeout: 5000})
          }, err => {
            try {
              this.flashMessage.show(`Error submitting new NodeServer. ${err.error.error}`, {
                cssClass: 'alert-danger',
                timeout: 5000})
            } catch (err) {
              this.flashMessage.show(`Error submitting new NodeServer. Unable to parse response from server.`, {
                cssClass: 'alert-danger',
                timeout: 5000})
            }
          })
        }
    }).catch((error) => {})
  }

  installNS(ns) {
    if (this.mqttConnected) {
      this.sockets.sendMessage('nodeservers', { 'installns': ns }, false, true)
      this.flashMessage.show(`Installing ${ns.name} please wait...`, {
        cssClass: 'alert-success',
        timeout: 5000})
    } else this.showDisconnected()
  }

  updateNS(ns) {
    const modalRef = this.modal.open(ModalNsUpdateComponent, { centered: true })
    modalRef.componentInstance.title = 'Upload profile to ISY?'
    modalRef.componentInstance.body = `Do you want to re-upload the profile.zip for ${ns.name} to ISY? This will NOT automatically reboot the ISY. Typically only a restart of the admin console is necessary. However, if your expected changes do not appear, please restart the ISY with the 'Reboot ISY' button above. 'No' will proceed with the update WITHOUT uploading the profile.`
    modalRef.result.then((isConfirmed) => {
      if (isConfirmed !== null) {
        if (isConfirmed) {
          ns['updateProfile'] = isConfirmed
        }
          if (this.mqttConnected) {
            this.sockets.sendMessage('nodeservers', { 'updatens': ns }, false, true)
            delete ns.updateProfile
            this.flashMessage.show(`Updating ${ns.name} please wait...`, {
              cssClass: 'alert-success',
              timeout: 5000})
          } else this.showDisconnected()
      }
    }).catch((error) => {})
  }

  uninstallNS(ns) {
    if (this.mqttConnected) {
      this.sockets.sendMessage('nodeservers', { 'uninstallns': ns }, false, true)
      this.flashMessage.show(`Uninstalling ${ns.name} please wait...`, {
        cssClass: 'alert-success',
        timeout: 5000})
    } else this.showDisconnected()
  }

  updateAvailable(ns) {
    let version = '0'
    if (this.installedTypes) {
      let idx = this.installedTypes.findIndex(n => n.name === ns.name)
      if (idx > -1)
        version = this.installedTypes[idx].credits[0].version
    }
    return this.compareVersions(version, '<', ns.version)
  }

  isInstalled(ns) {
    let idx = -1
    if (this.installedTypes)
      idx = this.installedTypes.findIndex(n => n.name === ns.name)
    return idx > -1
  }

  addConfirm(ns) {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = 'Install NodeServer?'
    modalRef.componentInstance.body = `Do you really want to install the NodeServer named ${ns.name}? This will clone the repository from: ${ns.url}`
    modalRef.result.then((isConfirmed) => {
        if (isConfirmed)
          this.installNS(ns)
    }).catch((error) => {})
  }

  delConfirm(ns) {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = 'Uninstall NodeServer?'
    modalRef.componentInstance.body = `Do you really want to uninstall the NodeServer named ${ns.name}? This will completely delete the NodeServer folder from Polyglot. CANNOT BE UNDONE.`
    modalRef.result.then((isConfirmed) => {
        if (isConfirmed)
          this.uninstallNS(ns)
    }).catch((error) => {})
  }

  showDisconnected() {
    this.flashMessage.show('Error not connected to Polyglot.', {
      cssClass: 'alert-danger',
      timeout: 3000})
  }

  compareVersions(v1, comparator, v2) {
    var comparator = comparator == '=' ? '==' : comparator;
    if(['==','===','<','<=','>','>=','!=','!=='].indexOf(comparator) == -1) {
        throw new Error('Invalid comparator. ' + comparator);
    }
    var v1parts = v1.split('.'), v2parts = v2.split('.');
    var maxLen = Math.max(v1parts.length, v2parts.length);
    var part1, part2;
    var cmp = 0;
    for(var i = 0; i < maxLen && !cmp; i++) {
        part1 = parseInt(v1parts[i], 10) || 0;
        part2 = parseInt(v2parts[i], 10) || 0;
        if(part1 < part2)
            cmp = 1;
        if(part1 > part2)
            cmp = -1;
    }
    return eval('0' + comparator + cmp);
  }

}
