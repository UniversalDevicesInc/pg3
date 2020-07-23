import { Component, OnInit, OnDestroy } from '@angular/core'
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms'
import { Router } from '@angular/router'
import { NgbModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap'
import { Subscription } from 'rxjs'
import { ToastrService } from 'ngx-toastr'
import { faEdit, faMinus, faPlus, faCheck, faWindowClose } from '@fortawesome/free-solid-svg-icons'

import { AuthService } from '../../services/auth.service'
import { SettingsService } from '../../services/settings.service'
import { WebsocketsService } from '../../services/websockets.service'
import { ConfirmComponent } from '../confirm/confirm.component'
import { environment } from '../../../environments/environment'
import { threadId } from 'worker_threads'

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription()
  isCollapsed: boolean = true
  faEdit = faEdit
  faMinus = faMinus
  faPlus = faPlus
  faCheck = faCheck
  faWindowClose = faWindowClose
  environment: any
  updateIsyForm: FormGroup
  addIsyForm: FormGroup
  modalOptions: NgbModalOptions

  constructor(
    public authService: AuthService,
    private router: Router,
    private modal: NgbModal,
    private fb: FormBuilder,
    public sockets: WebsocketsService,
    public settings: SettingsService,
    private toastr: ToastrService
  ) {
    this.environment = environment
    this.modalOptions = {
      centered: true,
      backdrop: 'static',
      backdropClass: 'customBackdrop'
    }
    this.updateIsyForm = this.fb.group({
      uuid: ['', Validators.required],
      name: ['', Validators.required],
      ip: ['0.0.0.0', Validators.required],
      port: [80, Validators.required],
      username: ['admin', Validators.required],
      password: [''],
      secure: ['', Validators.required]
    })
    this.addIsyForm = this.fb.group({
      name: ['', Validators.required],
      ip: ['', Validators.required],
      port: [80, Validators.required],
      username: ['admin', Validators.required],
      password: ['', Validators.required],
      secure: ['', Validators.required]
    })
  }

  ngOnInit() {
    this.settings.getPolisy()
    // this.getConnected()
    // this.subscription.add(
    //   this.sockets.getIsys.subscribe((isys: any[]) => {
    //     if (isys !== null) {
    //       this.isys = []
    //       this.settings.isys = isys
    //       const currentIsy = localStorage.getItem('currentIsy')
    //       let found = false
    //       isys.map(item => {
    //         this.isys.push(item.uuid)
    //         if (currentIsy && item.uuid === currentIsy) found = true
    //       })
    //       let selectedIsy
    //       if (!found) selectedIsy = this.isys[0]
    //       if (!currentIsy) {
    //         const profile = JSON.parse(localStorage.getItem('profile'))
    //         if (profile.preferredIsy === 'none') {
    //           console.log(`No preferred ISY Found. Using first in list.`)
    //           selectedIsy = this.isys[0]
    //         } else {
    //           selectedIsy = profile.preferredIsy
    //         }
    //       } else selectedIsy = currentIsy
    //       this.settings.isys.map(item => {
    //         if (item.uuid === selectedIsy) {
    //           this.updateCurrentIsy(item)
    //         }
    //       })
    //     }
    //   })
    // )
  }

  onclick() {
    alert('Clicked')
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  updateCurrentIsy(isy) {
    if (isy && isy.hasOwnProperty('uuid')) {
      localStorage.setItem('currentIsy', isy.uuid)
      this.settings.currentIsy.next(isy)
    }
  }

  refreshIsys() {
    this.sockets.sendMessage('system', { getIsys: {} })
  }

  discoverIsys() {
    this.sockets.sendMessage('system', { discoverIsys: {} })
  }

  showConfirm() {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = 'Reboot ISY?'
    modalRef.componentInstance.body = `This will reboot the ISY. This is usually not necessary. You should try to restart the admin console first. Are you sure?`
    modalRef.result
      .then(isConfirmed => {
        if (isConfirmed) this.rebootClick()
      })
      .catch(error => {})
  }

  showRestartConfirm() {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = 'Restart Polyglot?'
    modalRef.componentInstance.body = `Like the upgrade procedure this will shut down Polyglot. If you do NOT have the auto-start scripts installed for linux(systemd) or OSX(launchctl) then Polyglot will NOT restart
                automatically. You will have to manually restart. You will be logged out. Continue?`
    modalRef.result
      .then(isConfirmed => {
        if (isConfirmed) this.restartClick()
      })
      .catch(error => {})
  }

  async openUpdate(form, content) {
    try {
      this[`${form}`].reset()
      if (this.settings.currentIsy.value) {
        this[`${form}`].patchValue(this.settings.currentIsy.value)
      }
      await this.modal.open(content, this.modalOptions).result
    } catch (err) {
      // This catches the modal cancel
    }
  }

  async openAdd(content) {
    try {
      this.addIsyForm.reset({ ip: '0.0.0.0', port: 80, username: 'admin', secure: 0 })
      await this.modal.open(content, this.modalOptions).result
    } catch {
      // This catches the modal cancel
    }
  }

  async open(content) {
    try {
      await this.modal.open(content, this.modalOptions).result
    } catch {
      // This catches the modal cancel
    }
  }

  getDirtyValues(cg) {
    const dirtyValues = {}
    Object.keys(cg.controls).forEach(c => {
      const currentControl = cg.get(c)

      if (currentControl.dirty) {
        if (currentControl.controls) {
          dirtyValues[c] = this.getDirtyValues(currentControl)
        } else {
          dirtyValues[c] = currentControl.value
        }
      }
    })
    return dirtyValues
  }

  async updateIsy(updates) {
    this.modal.dismissAll()
    if (Object.keys(updates).length <= 0) return this.toastr.error(`Nothing updated`)
    this.sockets.sendMessage('system', {
      updateIsy: { uuid: this.settings.currentIsy.value['uuid'], ...updates }
    })
    this.toastr.success(
      `Updating ${this.settings.currentIsy.value['name']} - ${
        this.settings.currentIsy.value['uuid']
      }: ${Object.keys(updates)}`
    )
  }

  async addIsy() {
    this.modal.dismissAll()
    if (!this.addIsyForm.valid) {
      return this.toastr.error(`Missing or invalid required field`)
    }
    const isy = this.addIsyForm.value
    this.sockets.sendMessage('system', {
      addIsy: isy
    })
    this.toastr.success(`Adding ISY: ${isy['name']} @ ${isy['ip']}:${isy['port']}`)
    this.addIsyForm.reset()
  }

  async removeIsy() {
    this.modal.dismissAll()
    const isy = this.settings.currentIsy.value
    this.sockets.sendMessage('system', { removeIsy: { uuid: isy['uuid'] } })
    this.toastr.success(`Removing ISY: ${isy['name']} @ ${isy['ip']}: ${isy['port']}`)
    this.settings.currentNodeServers.next([])
  }

  restartClick() {
    if (this.sockets.connected) {
      this.sockets.sendMessage('nodeservers', { restartPolyglot: {} })
      this.toastr.warning(
        'Sent Restart command to Polyglot. You will be logged out. Please wait till this message disappears to attempt to login again.',
        null,
        { timeOut: 20000 }
      )
      setTimeout(() => {
        this.onLogoutClick()
      }, 2000)
    }
  }

  rebootClick() {
    if (this.sockets.connected) {
      this.sockets.sendMessage('system', {
        reboot: { uuid: this.settings.currentIsy.value['uuid'] }
      })
      this.toastr.success(`Sent Reboot command to ISY.`)
    } else this.showDisconnected()
  }

  showDisconnected() {
    this.toastr.error(`Not connected to PG3`)
  }

  onLogoutClick() {
    this.authService.logout()
    this.subscription.unsubscribe()
    this.sockets.stop()
    this.toastr.success(`Logged out`)
    this.router.navigate(['/login'])
  }

  confirmSystem(type) {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = `${type.charAt(0).toUpperCase() + type.slice(1)}?`
    if (type === 'reboot') {
      modalRef.componentInstance.body = `Are you sure you want to ${type}? This could take serveral minutes to restart the Polisy device.`
    } else if (type === 'upgrade') {
      modalRef.componentInstance.body = `Are you sure you want to ${type}?`
    } else {
      modalRef.componentInstance.body = `Are you sure you want to ${type}? You will have to manually restart your Polisy device.`
    }
    modalRef.result
      .then(isConfirmed => {
        this.systemControl(type, isConfirmed)
      })
      .catch(error => console.log(error))
  }

  systemControl(type, confirmed) {
    if (confirmed) {
      this.sockets.sendMessage(`polisy/${type}`, null)
      window.scrollTo(0, 0)
      if (type === 'upgrade') {
        this.toastr.success(`Sent ${type} command to Polisy. Please wait...`, null, {
          timeOut: 20000
        })
      } else {
        this.toastr.success(
          `Sent ${type} command to Polisy. Please wait till this message disappears to attempt to login again.`,
          null,
          { timeOut: 30000 }
        )
        setTimeout(() => {
          this.onLogoutClick()
        }, 5000)
      }
    }
  }

  upgradecheck() {
    this.sockets.sendMessage(`polisy/upgrade/check`, null)
    // this.flashMessage.show(
    //   `Sent upgrade check command to Polisy. This could take a few minutes. A notice will display when it is complete.`,
    //   { cssClass: 'alert-success', timeout: 10000 }
    // )
    window.scrollTo(0, 0)
  }
}
