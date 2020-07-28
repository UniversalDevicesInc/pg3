import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core'
import { AuthService } from '../../services/auth.service'
import { SettingsService } from '../../services/settings.service'
import { WebsocketsService } from '../../services/websockets.service'
import { AddnodeService } from '../../services/addnode.service'
import { Router } from '@angular/router'
import { Subscription } from 'rxjs'
import { ToastrService } from 'ngx-toastr'
import { FormBuilder, FormGroup, Validators } from '@angular/forms'

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, OnDestroy {
  //@ViewChild('file', { static: false }) file
  public settingsForm: FormGroup
  private subscription: Subscription = new Subscription()

  file: File

  constructor(
    private fb: FormBuilder,
    private sockets: WebsocketsService,
    private authService: AuthService,
    private router: Router,
    public settings: SettingsService,
    private toastr: ToastrService,
    private addNodeService: AddnodeService
  ) {
    this.settingsForm = this.fb.group({
      ipAddress: '',
      listenPort: [3000, Validators.required],
      secure: false,
      beta: false
    })
  }

  ngOnInit() {
    this.subscription.add(
      this.settings.globalSettings.subscribe(settings => {
        if (!settings) return
        this.settingsForm.reset(this.settings.globalSettings.value)
      })
    )
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
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

  saveSettings(settings) {
    if (this.sockets.connected) {
      if (JSON.stringify(settings) !== '{}') {
        this.sockets.sendMessage('system', { setSettings: settings })
        window.scrollTo(0, 0)
      } else {
        this.toastr.error('No Settings Changed.')
        window.scrollTo(0, 0)
      }
    } else {
      this.toastr.error('Not connected to backend. Settings not saved.')
      window.scrollTo(0, 0)
    }
  }

  onFileChanged(event) {
    this.file = event.target.files[0]
  }

  getBackup() {
    this.settings.downloadBackup()
  }

  restoreBackup() {
    if (this.file) {
      const formData = new FormData()
      formData.append('file', this.file)
      this.toastr.success('Restore starting. This may take some time, please wait...')
      window.scrollTo(0, 0)
      this.settings.restoreBackup(formData).subscribe(data => {
        if (data['success']) {
          this.toastr.success('Restore Completed Sucessfully. Restarting in 5 seconds.')
          window.scrollTo(0, 0)
          this.logout()
        } else {
          this.toastr.error(data['msg'])
          window.scrollTo(0, 0)
        }
        this.file = null
      })
    }
  }

  logout() {
    this.authService.logout()
    this.sockets.stop()
    this.toastr.success('Logging you out.')
    this.router.navigate(['/login'])
  }
}
