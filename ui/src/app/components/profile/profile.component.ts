import { Component, OnInit, OnDestroy } from '@angular/core'
import { AuthService } from '../../services/auth.service'
import { WebsocketsService } from '../../services/websockets.service'
import { SettingsService } from '../../services/settings.service'
import { Router } from '@angular/router'
import { FlashMessagesService } from 'angular2-flash-messages'
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})

export class ProfileComponent implements OnInit, OnDestroy {

  public mqttConnected: boolean = false
  private subConnected: any
  public profileForm: FormGroup
  user: Object

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private flashMessage: FlashMessagesService,
    public sockets: WebsocketsService,
    private settingsService: SettingsService
  ) { }

  ngOnInit() {
    this.getConnected()
    this.profileForm = this.fb.group({
      username: '',
      password: ''
    })
    this.authService.getProfile().subscribe(profile => {
      this.user = profile['user']
      this.profileForm.patchValue({
        username: profile['user'].username
      })
    },
    err => {
      console.log(err)
      return false
    })
  }

  ngOnDestroy() {
    if (this.subConnected) { this.subConnected.unsubscribe() }
  }

  getConnected() {
    this.subConnected = this.sockets.mqttConnected.subscribe(connected => {
      this.mqttConnected = connected
    })
  }

  logout() {
    this.authService.logout()
    this.sockets.stop()
    this.flashMessage.show('Password Changed. Logging you out.', {
      cssClass: 'alert-success',
      timeout: 3000
    })
    this.router.navigate(['/login'])
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

  saveProfile(profile) {
    if (this.sockets.connected) {
      if (JSON.stringify(profile) !== '{}') {
        profile['_id'] = this.user['_id']
        this.sockets.sendMessage('settings', {updateprofile: profile}, false, true)
        this.flashMessage.show('Profile saved successfully.', {
          cssClass: 'alert-success',
          timeout: 5000})
        window.scrollTo(0, 0)
        this.logout()
      }
    } else {
      this.flashMessage.show('Websockets not connected to Polyglot. Profile not saved.', {
        cssClass: 'alert-danger',
        timeout: 5000})
      window.scrollTo(0, 0)
    }
  }

}
