import { Component, OnInit, OnDestroy } from '@angular/core'
import { WebsocketsService } from '../../services/websockets.service'
import { AuthService } from '../../services/auth.service'
import { SettingsService } from '../../services/settings.service'
import { AddnodeService } from '../../services/addnode.service'
import { FlashMessagesService } from 'angular2-flash-messages'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { Router } from '@angular/router'
import { ConfirmComponent } from '../confirm/confirm.component'
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit, OnDestroy {

  Math: any
  private subConnected: any
  private subLoggedIn: any
  private subSettings: any
  private subPolyVersion: any
  private subUpgrade: any
  private gotPackage: boolean = false
  public polyPackage: String
  public loggedIn: boolean = false
  public isPolisy: boolean
  public isyVersion: String
  public pgVersion: String
  public currentVersion: String
  public updateAvail: boolean = false
  public upgradeData: any
  public timeStarted: any
  public uptime: any
  public mqttConnected: any
  public uptimeInterval: any
  private upgrading: boolean = false
  public year = new Date().getFullYear()
  version: string = environment.VERSION
  stage: string = environment.STAGE
  private progress = {
    percent: 0
  }

  constructor(
    private modal: NgbModal,
    private addNodeService: AddnodeService,
    private flashMessage: FlashMessagesService,
    private router: Router,
    private sockets: WebsocketsService,
    public settings: SettingsService,
    public authService: AuthService
  ) { this.Math = Math }

  ngOnInit() {
    this.getConnected()
    this.getLoggedIn()
    this.getSettings()
    this.getPolyVersion()
    this.getUpgrade()
    if (this.authService.loggedIn())
      if (!this.sockets.connected) this.sockets.start()
  }

  ngOnDestroy() {
    this.cleanup()
  }

  getConnected() {
    this.subConnected = this.sockets.mqttConnected.subscribe(connected => {
      this.mqttConnected = connected
    })
  }

  /*
  getPolyglot() {
    this.subPolyglot = this.sockets.polyglotData.subscribe(polyglot => {
      console.log(polyglot)
      this.polyglot = polyglot
    })
  } */

  getLoggedIn() {
    this.subLoggedIn = this.authService.isLoggedIn.subscribe(state => {
      this.loggedIn = state
      if (state)
        if (!this.sockets.connected) this.sockets.start()
      if (!state)
        this.cleanup()
    })
  }

  getSettings() {
    this.subSettings = this.sockets.settingsData.subscribe(settings => {
      this.isyVersion = settings.isyVersion
      this.pgVersion = settings.pgVersion
      this.timeStarted = settings.timeStarted
      this.calculateUptime()
      if (!this.uptimeInterval) {
        this.uptimeInterval = setInterval(() => {
          this.calculateUptime()
        }, 1000)
      }
    })
  }

  getPolyVersion() {
    this.subPolyVersion = this.addNodeService.upgradeSubject.subscribe(doc => {
      this.polyPackage = doc
      this.currentVersion = doc.version
      this.gotPackage = true
      this.checkUpgrade()
    })
  }

  getUpgrade() {
    this.subUpgrade = this.sockets.upgradeData.subscribe(data => {
      if (data.hasOwnProperty('start')) {
        if (data.start.success) {
          this.flashMessage.show(data.start.msg, {
            cssClass: 'alert-success',
            timeout: 5000})
        } else {
          this.flashMessage.show(data.start.msg, {
            cssClass: 'alert-danger',
            timeout: 6000})
          this.upgrading = false
          window.scrollTo(0, 0)
        }
      } else if (data.hasOwnProperty('stop')) {
        if (data.stop.success) {
          this.flashMessage.show(data.stop.msg, {
            cssClass: 'alert-success',
            timeout: 5000})
            this.upgrading = false
            window.scrollTo(0, 0)
        } else {
          this.flashMessage.show(data.stop.msg, {
            cssClass: 'alert-danger',
            timeout: 5000})
          this.upgrading = false
          window.scrollTo(0, 0)
        }
      } else if (data.hasOwnProperty('error')) {
        this.flashMessage.show(data.error.msg, {
          cssClass: 'alert-danger',
          timeout: 5000})
        this.upgrading = false
        window.scrollTo(0, 0)
      } else if (data.hasOwnProperty('progress')) {
        this.progress = data.progress
      } else if (data.hasOwnProperty('complete')) {
        this.flashMessage.show(data.complete.msg, {
          cssClass: 'alert-success',
          timeout: 20000})
        this.upgrading = false
        window.scrollTo(0, 0)
        setTimeout(() => {
          this.logout()
        }, 2000)
      }
    })
  }

  logout() {
    this.updateAvail = false
    this.cleanup()
    this.pgVersion = null
    this.authService.logout()
    this.sockets.stop()
    this.flashMessage.show('You are logged out.', {
      cssClass: 'alert-success',
      timeout: 3000
    })
    this.router.navigate(['/login'])
  }

  cleanup() {
    if (this.subConnected) { this.subConnected.unsubscribe() }
    //if (this.subPolyglot) { this.subPolyglot.unsubscribe() }
    if (this.subSettings) { this.subSettings.unsubscribe() }
    if (this.subPolyVersion) { this.subPolyVersion.unsubscribe() }
    if (this.subUpgrade) { this.subUpgrade.unsubscribe() }
    if (this.uptimeInterval) { clearInterval(this.uptimeInterval) }
  }

  checkUpgrade() {
    if (this.pgVersion && this.currentVersion) {
      this.updateAvail = this.compareVersions(this.pgVersion, '<', this.currentVersion)
    }
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

  showConfirm() {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = `Upgrade Polyglot? New version available ${this.currentVersion}`
    modalRef.componentInstance.body = `Upgrading Polyglot from here will automatically download the latest binary for your system type and extract it OVER the existing binary. It will
                then exit Polyglot. If you do NOT have the auto-start scripts installed for linux(systemd) or OSX(launchctl) then Polyglot will NOT restart
                automatically. You will have to manually restart. If you are not using the binary, upgrade via git. Continue?`
    modalRef.result.then((isConfirmed) => {
        if (isConfirmed)
          this.upgradeSubmit()
    })
  }

  upgradeSubmit() {
    this.upgrading = true
    this.sockets.sendMessage('upgrade', {start: ''})
  }

  calculateUptime() {
    //var seconds = Math.floor(()/1000)
    var d = Math.abs(+ new Date() - this.timeStarted) / 1000
    var r = {}
    var s = {
        'Year(s)': 31536000,
        'Month(s)': 2592000,
        'Week(s)': 604800,
        'Day(s)': 86400,
        'Hour(s)': 3600,
        'Minute(s)': 60,
        'Second(s)': 1
    }

    Object.keys(s).forEach(function(key){
        r[key] = Math.floor(d / s[key])
        d -= r[key] * s[key]
    })
    let uptime = ''
    for (let key in r) {
      if (r[key] !== 0 )
        uptime += `${r[key]} ${key} `
    }
    this.uptime = uptime
  }

}
