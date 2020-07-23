import { Component, OnInit, OnDestroy } from '@angular/core'
import { AddnodeService } from '../../services/addnode.service'
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap'
import { ConfirmComponent } from '../confirm/confirm.component'
import { ModalNsUpdateComponent } from '../modal-ns-update/modal-ns-update.component'
import { ModalNsAddComponent } from '../modal-ns-add/modal-ns-add.component'
import { SettingsService } from '../../services/settings.service'
import { WebsocketsService } from '../../services/websockets.service'
import { Subscription } from 'rxjs'
import { ToastrService } from 'ngx-toastr'
import {
  faAngleDoubleDown,
  faAngleDoubleUp,
  faWindowClose
} from '@fortawesome/free-solid-svg-icons'

@Component({
  selector: 'app-getns',
  templateUrl: './getns.component.html',
  styleUrls: ['./getns.component.css']
})
export class GetnsComponent implements OnInit, OnDestroy {
  Math: any
  public mqttConnected: boolean = false
  public nsList: any
  public received: boolean = false
  faAngleDoubleDown = faAngleDoubleDown
  faAngleDoubleUp = faAngleDoubleUp
  faWindowClose = faWindowClose
  selectedSlot = 0
  private modalOptions: NgbModalOptions
  current: Object = {}
  private subscription: Subscription = new Subscription()
  selectedRow: any
  maxNodeServers: Number = 25
  nsArray: any[] = new Array(this.maxNodeServers).fill(1).map((x, i) => i + 1)

  constructor(
    private addNodeService: AddnodeService,
    private sockets: WebsocketsService,
    public settingsService: SettingsService,
    private modal: NgbModal,
    private toastr: ToastrService
  ) {
    this.Math = Math
    this.modalOptions = {
      centered: true,
      backdrop: 'static',
      backdropClass: 'customBackdrop'
    }
  }

  ngOnInit() {
    this.getConnected()
    this.getNSList()
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  getConnected() {
    this.subscription.add(
      this.sockets.mqttConnected.subscribe(connected => {
        this.mqttConnected = connected
        if (connected) this.sockets.sendMessage('nodeservers', { nodetypes: '' })
      })
    )
  }

  getNSList() {
    this.addNodeService.getNSList().subscribe(nsList => {
      if (!nsList) return
      this.nsList = nsList
      this.received = true
      this.toastr.success(`Refreshed NodeServers List from Server.`)
    })
  }

  async open(content, item) {
    try {
      this.current = item || {}
      await this.modal.open(content, this.modalOptions).result
      if (this.selectedSlot === 0) {
        return this.toastr.error(`Nodeserver Slot not selected. Try again.`)
      }
      this.installNS()
    } catch (err) {
      // This catches the modal cancel
      this.selectedSlot = 0
      this.current = {}
    }
  }

  addNS() {
    const modalRef = this.modal.open(ModalNsAddComponent, { centered: true })
    modalRef.componentInstance.title = 'Add NodeServer to Polyglot Repository'
    modalRef.componentInstance.body = `Please enter the Github repository link to submit to the Polyglot team for addition into the NodeServer Store.`
    modalRef.result
      .then(nslink => {
        if (nslink) {
          this.addNodeService.submitNewNS(nslink).subscribe(
            response => {
              this.toastr.success(`Submitted new NodeServer for approval to the Polyglot team.`)
            },
            err => {
              try {
                this.toastr.error(`Error submitting new NodeServer. ${err.error.error}`)
              } catch (err) {
                this.toastr.error(
                  `Error submitting new NodeServer. Unable to parse response from server.`
                )
              }
            }
          )
        }
      })
      .catch(error => {})
  }

  installNS() {
    if (this.mqttConnected) {
      this.current['uuid'] = this.settingsService.currentIsy.value['uuid']
      this.current['profileNum'] = this.selectedSlot
      console.log(this.current, this.selectedSlot)
      this.sockets.sendMessage('isy', { installNs: this.current }, false, false)
      this.toastr.success(`Installing ${this.current['name']} please wait...`)
      this.selectedSlot = 0
      this.current = {}
    } else this.showDisconnected()
  }

  uninstallNS(ns) {
    if (this.mqttConnected) {
      this.sockets.sendMessage('nodeservers', { removeNs: ns }, false, true)
      this.toastr.success(`Uninstalling ${ns.name} please wait...`)
    } else this.showDisconnected()
  }

  // updateAvailable(ns) {
  //   let version = '0'
  //   if (this.installedTypes) {
  //     let idx = this.installedTypes.findIndex(n => n.name === ns.name)
  //     if (idx > -1) version = this.installedTypes[idx].credits[0].version
  //   }
  //   return this.compareVersions(version, '<', ns.version)
  // }

  // addConfirm(ns) {
  //   const modalRef = this.modal.open(ConfirmComponent, { centered: true })
  //   modalRef.componentInstance.title = 'Install NodeServer?'
  //   modalRef.componentInstance.body = `Do you really want to install the NodeServer named ${ns.name}? This will clone the repository from: ${ns.url}`
  //   modalRef.result
  //     .then(isConfirmed => {
  //       if (isConfirmed) this.installNS(ns)
  //     })
  //     .catch(error => {})
  // }

  // delConfirm(ns) {
  //   const modalRef = this.modal.open(ConfirmComponent, { centered: true })
  //   modalRef.componentInstance.title = 'Uninstall NodeServer?'
  //   modalRef.componentInstance.body = `Do you really want to uninstall the NodeServer named ${ns.name}? This will completely delete the NodeServer folder from Polyglot. CANNOT BE UNDONE.`
  //   modalRef.result
  //     .then(isConfirmed => {
  //       if (isConfirmed) this.uninstallNS(ns)
  //     })
  //     .catch(error => {})
  // }

  showDisconnected() {
    this.toastr.error('Error not connected to Polyglot.')
  }

  compareVersions(v1, comparator, v2) {
    var comparator = comparator == '=' ? '==' : comparator
    if (['==', '===', '<', '<=', '>', '>=', '!=', '!=='].indexOf(comparator) == -1) {
      throw new Error('Invalid comparator. ' + comparator)
    }
    var v1parts = v1.split('.'),
      v2parts = v2.split('.')
    var maxLen = Math.max(v1parts.length, v2parts.length)
    var part1, part2
    var cmp = 0
    for (var i = 0; i < maxLen && !cmp; i++) {
      part1 = parseInt(v1parts[i], 10) || 0
      part2 = parseInt(v2parts[i], 10) || 0
      if (part1 < part2) cmp = 1
      if (part1 > part2) cmp = -1
    }
    return eval('0' + comparator + cmp)
  }
}
