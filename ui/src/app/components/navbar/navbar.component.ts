import { Component, OnInit, OnDestroy } from '@angular/core'
import { AuthService } from '../../services/auth.service'
import { SettingsService } from '../../services/settings.service'
import { Router } from '@angular/router'
import { WebsocketsService } from '../../services/websockets.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { ConfirmComponent } from '../confirm/confirm.component'
import { Subscription } from 'rxjs'
import { ToastrService } from 'ngx-toastr'

import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  private subscription: Subscription = new Subscription()
  isCollapsed: boolean = true
  public mqttConnected: boolean = false
  private subConnected: any
  username: string
  environment: any
  isys = []
  dashboard = 'Dashboard'

  constructor(
    public authService: AuthService,
    private router: Router,
    private modal: NgbModal,
    public sockets: WebsocketsService,
    public settings: SettingsService,
    private toastr: ToastrService
  ) {
    this.environment = environment
  }

  ngOnInit() {
    this.settings.getPolisy()
    this.getConnected()
    this.subscription.add(
      this.sockets.getIsys.subscribe((isys: any[]) => {
        if (isys !== null) {
          this.isys = []
          this.settings.isys = isys
          isys.map(item => this.isys.push(item.uuid))
          let selectedIsy
          const currentIsy = localStorage.getItem('currentIsy')
          if (!currentIsy) {
            const profile = JSON.parse(localStorage.getItem('profile'))
            if (profile.preferredIsy === 'none') {
              console.log(`No preferred ISY Found. Using first in list.`)
              selectedIsy = this.isys[0]
            } else {
              selectedIsy = profile.preferredIsy
            }
          } else selectedIsy = currentIsy
          this.settings.isys.map(item => {
            if (item.uuid === selectedIsy) {
              this.updateCurrentIsy(item)
            }
          })
        }
      })
    )
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  updateCurrentIsy(isy) {
    if (isy && isy.hasOwnProperty('uuid')) {
      if (this.settings.currentIsy.value && this.settings.currentIsy.value['uuid'] === isy.uuid) {
        return
      }
      localStorage.setItem('currentIsy', isy.uuid)
      this.settings.currentIsy.next(isy)
      this.dashboard = isy ? `${isy.name || isy.uuid} Dashboard` : 'Dashboard'
    }
  }

  refreshIsys() {
    this.sockets.sendMessage('system', { getIsys: {} })
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

  getConnected() {
    this.subscription.add(
      this.sockets.mqttConnected.subscribe(connected => {
        this.mqttConnected = connected
      })
    )
  }

  restartClick() {
    if (this.mqttConnected) {
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
    if (this.mqttConnected) {
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
