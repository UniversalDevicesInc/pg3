import { Component, OnInit, OnDestroy } from '@angular/core'
import { AuthService } from '../../services/auth.service'
//import { SettingsService } from '../../services/settings.service'
import { WebsocketsService } from '../../services/websockets.service'
import { Router } from '@angular/router'
import { ToastrService } from 'ngx-toastr'

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  username: String
  password: String
  authSub: any

  constructor(
    private sockets: WebsocketsService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService //private settingsService: SettingsService,
  ) {}

  ngOnInit() {}

  ngOnDestroy() {
    if (this.authSub) this.authSub.unsubscribe()
  }

  onLoginSubmit() {
    const user = {
      username: this.username,
      password: this.password
    }

    this.authSub = this.authService.authenticateUser(user).subscribe(
      data => {
        if (data === null) {
          return
        }
        if (data && data['success']) {
          //this.authService.storeUserData(data['token'], ['data.user'])
          //this.settingsService.getSettings().subscribe(settings => {
          //  this.settingsService.storeSettings(settings)
          //})
          this.sockets.start()
          this.router.navigate(['/dashboard'])
          this.toastr.success('You are now logged in')
        }
      },
      err => {
        console.log(err)
        this.toastr.error(err['message'])
        this.router.navigate(['/login'])
      }
    )
  }
}
