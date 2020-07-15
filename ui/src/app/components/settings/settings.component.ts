import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core'
import { AuthService } from '../../services/auth.service'
import { SettingsService } from '../../services/settings.service'
import { WebsocketsService } from '../../services/websockets.service'
import { AddnodeService } from '../../services/addnode.service'
import { Router } from '@angular/router'
import { FlashMessagesService } from 'angular2-flash-messages'
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})

export class SettingsComponent implements OnInit, OnDestroy {
  //@ViewChild('file', { static: false }) file
  public mqttConnected: boolean = false
  private subConnected: any
  public settingsForm: FormGroup
  private subSettings: any
  private subResponses: any

  file: File

  constructor(
    private fb: FormBuilder,
    private sockets: WebsocketsService,
    private authService: AuthService,
    private router: Router,
    private flashMessage: FlashMessagesService,
    private settingsService: SettingsService,
    private addNodeService: AddnodeService
  ) {}

  ngOnInit() {
    this.getConnected()
    this.settingsForm = this.fb.group({
      listenPort: [3000, Validators.required],
      isyHost: ['', Validators.required],
      isyPort: [80, Validators.required],
      isyUsername: ['', Validators.required],
      isyPassword: '',
      isyHttps: false,
      mqttHost: ['', Validators.required],
      mqttPort: 1883,
      useBeta: false
    })
    this.getSettings()
    this.getSettingResponses()
  }

  ngOnDestroy() {
    if (this.subConnected) { this.subConnected.unsubscribe() }
    if (this.subSettings) { this.subSettings.unsubscribe() }
    if (this.subResponses) { this.subResponses.unsubscribe() }
  }

  getConnected() {
    this.subConnected = this.sockets.mqttConnected.subscribe(connected => {
      this.mqttConnected = connected
    })
  }

  getSettings() {
    this.subSettings = this.sockets.settingsData.subscribe(settings => {
      this.settingsService.storeSettings(settings)
      this.addNodeService.getPolyglotVersion()
      this.settingsForm.patchValue({
        listenPort: settings.listenPort,
        isyHost: settings.isyHost,
        isyPort: settings.isyPort,
        isyUsername: settings.isyUsername,
        isyHttps: settings.isyHttps,
        mqttHost: settings.mqttHost,
        mqttPort: settings.mqttPort,
        useBeta: settings.useBeta || false,
      })
    })
  }

  getSettingResponses() {
    this.subResponses = this.sockets.settingsResponse.subscribe(response => {
      if (response.hasOwnProperty('success')) {
        if (response.success) {
          this.flashMessage.show('Settings saved successfully. If you changed the Polyglot Web Port, please restart Polyglot.', {
            cssClass: 'alert-success',
            timeout: 10000})
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

  sendSettingsREST(settings) {
    this.settingsService.setSettings(settings).subscribe(data => {
      if (data['success']) {
        this.flashMessage.show('Settings saved successfully.', {
          cssClass: 'alert-success',
          timeout: 5000})
        window.scrollTo(0, 0)
      } else {
        this.flashMessage.show(data['msg'], {
          cssClass: 'alert-danger',
          timeout: 5000})
        window.scrollTo(0, 0)
      }
    })
  }

  getDirtyValues(cg) {
    const dirtyValues = {}
    Object.keys(cg.controls).forEach((c) => {
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

  saveSettings(settings) {
    if (this.mqttConnected) {
      if (JSON.stringify(settings) !== '{}') {
        this.sockets.sendMessage('settings', {updatesettings: settings}, false, true)
      } else {
        this.flashMessage.show('No Settings Changed.', {
          cssClass: 'alert-danger',
          timeout: 5000})
        window.scrollTo(0, 0)
      }
    } else {
      this.flashMessage.show('Not connected to Polyglot. Settings not saved.', {
        cssClass: 'alert-danger',
        timeout: 5000})
      window.scrollTo(0, 0)
    }
  }

  onFileChanged(event) {
    this.file = event.target.files[0]
  }

  getBackup() {
    this.settingsService.downloadBackup()
  }

  restoreBackup() {
    if (this.file) {
      const formData = new FormData()
      formData.append('file', this.file)
      this.flashMessage.show('Restore starting. This may take some time, please wait...', {
        cssClass: 'alert-success',
        timeout: 10000})
      window.scrollTo(0, 0)
      this.settingsService.restoreBackup(formData).subscribe(data => {
        if (data['success']) {
          this.flashMessage.show('Restore Completed Sucessfully. Polyglot Restarting in 5 seconds.', {
            cssClass: 'alert-success',
            timeout: 5000})
          window.scrollTo(0, 0)
          this.logout()
        } else {
          this.flashMessage.show(data['msg'], {
            cssClass: 'alert-danger',
            timeout: 5000})
          window.scrollTo(0, 0)
        }
        this.file = null
      })
    }
  }

  logout() {
    this.authService.logout()
    this.sockets.stop()
    this.flashMessage.show('Logging you out.', {
      cssClass: 'alert-success',
      timeout: 3000
    })
    this.router.navigate(['/login'])
  }
}
