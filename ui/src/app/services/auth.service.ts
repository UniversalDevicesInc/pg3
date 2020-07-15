import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { environment } from '../../environments/environment'

import { SettingsService } from './settings.service'
import { ReplaySubject } from 'rxjs'
import { tap } from 'rxjs/operators'
//import { WebsocketsService } from './websockets.service'
import { JwtHelper } from '../helpers/token'

@Injectable()
export class AuthService {
  authToken: any
  user: any
  public isLoggedIn: ReplaySubject<boolean> = new ReplaySubject(1)

  constructor(
    private http: HttpClient,
    private settingsService: SettingsService,
    //private sockets: WebsocketsService
  ) { }

  /*
  registerUser(user){
    let headers = new Headers()
    headers.append('Content-Type', 'application/json')
    return this.http.post('https://10.0.0.75:3000/frontend/register', user, {headers: headers})
      .map(res => res.json())
  }
  */

  authenticateUser(user) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    })
    return this.http.post(`${environment.PG_URI}/frontend/authenticate`, user, {headers: headers})
    .pipe(
      tap((response: Response) => {
        let data = {success: false, msg: response['msg'] }
        let token = response['token']
        if (token) {
          this.authToken = token
          this.storeUserData(token, response['user'].username)
          this.settingsService.storeSettings(response['settings'])
          data.success = true
          this.isLoggedIn.next(true)
          return data
        } else return data
      })
    )
  }

  getProfile() {
    this.loadToken()
    const headers = new HttpHeaders({
      Authorization: this.authToken,
      'Content-Type': 'application/json'
    })
    return this.http.get(`${environment.PG_URI}/frontend/profile`, {headers: headers})
  }

  storeUserData(token, user) {
    localStorage.setItem('id_token', token)
    //localStorage.setItem('user', JSON.stringify(user))
    this.authToken = token
    this.user = user
  }

  loadToken() {
    const token = localStorage.getItem('id_token')
    this.authToken = token
  }

  loggedIn() {
    return this.tokenNotExpired('id_token')
  }

  logout() {
    this.authToken = null
    this.user = null
    localStorage.clear()
    this.isLoggedIn.next(false)
    //this.sockets.stop()
  }

  tokenNotExpired(tokenName, jwt?:string): boolean {
    const token: string = jwt || localStorage.getItem(tokenName);
    const jwtHelper = new JwtHelper();
    return token != null && !jwtHelper.isTokenExpired(token);
  }

}
