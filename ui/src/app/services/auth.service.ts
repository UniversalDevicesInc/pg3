import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { environment } from '../../environments/environment'

import { SettingsService } from './settings.service'
import { BehaviorSubject } from 'rxjs'
import { tap } from 'rxjs/operators'
//import { WebsocketsService } from './websockets.service'
import { JwtHelper } from '../helpers/token'
import { ToastrService } from 'ngx-toastr'

@Injectable()
export class AuthService {
  authToken: any
  user: any
  portalAuth: Object = {}
  refreshingToken = false
  public isLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject(false)
  public portalLoggedIn: BehaviorSubject<boolean> = new BehaviorSubject(false)

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private settingsService: SettingsService //private sockets: WebsocketsService
  ) {}

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
    return this.http.post(`${environment.PG_URI}/auth`, user, { headers: headers }).pipe(
      tap((response: Response) => {
        let data = { success: false, msg: response['msg'] }
        let token = response['token']
        if (token) {
          console.log(response)
          this.authToken = token
          this.storeUserData(token, response['user'])
          this.settingsService.storeSettings(response['settings'])
          this.settingsService.globalSettings.next(response['settings'])
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
    return this.http.get(`${environment.PG_URI}/frontend/profile`, { headers: headers })
  }

  storeUserData(token, user) {
    localStorage.setItem('id_token', token)
    localStorage.setItem('profile', JSON.stringify({ ...user, preferredIsy: 'none' }))
    this.authToken = token
    this.user = user.name
  }

  loadToken() {
    this.authToken = localStorage.getItem('id_token')
    this.user = JSON.parse(localStorage.getItem('profile')).name
  }

  loggedIn() {
    return this.tokenNotExpired('id_token')
  }

  loadPortalData() {
    this.portalAuth = JSON.parse(localStorage.getItem('portalData'))
    return this.portalAuth
  }

  storePortalData(tokenDataB64) {
    try {
      const tokenData = JSON.parse(Buffer.from(tokenDataB64, 'base64').toString('utf8'))
      localStorage.setItem('portalData', JSON.stringify(tokenData))
      this.portalAuth = tokenData
      this.portalLoggedIn.next(true)
    } catch (err) {
      console.log(err.stack)
    }
  }

  portalLogin() {
    // remove any queryparams
    const currentLoc = window.location.href.split('?')[0]
    const state = Buffer.from(JSON.stringify({ url: currentLoc })).toString('base64')
    window.location.href = `https://pg3oauth.isy.io/v1/redirect?state=${state}`
  }

  portalLogout() {
    this.portalLoggedIn.next(false)
    localStorage.removeItem('portalData')
    this.portalAuth = {}
  }

  async portalCheckRefresh() {
    this.loadPortalData()
    if (
      this.portalAuth &&
      this.portalAuth.hasOwnProperty('access_token') &&
      this.portalAuth.hasOwnProperty('authExpires') &&
      this.portalAuth.hasOwnProperty('refreshExpires')
    ) {
      let now = +Date.now()
      // If refresh token expired
      // Token Expired
      if (now > this.portalAuth['authExpires']) {
        // Token expired or expires in less than 5 minutes
        // if ((now > this.portalAuth.authExpires - 1000 * 600) && (now < this.portalAuth.refreshExpires)) {
        //   this.toastr.warning(`Portal Access Token Expired. Refreshing...`)
        //   return await portalRefreshTokens()
        // }
        this.portalLogout()
        return false
      }
      // access_token not expired
      this.portalLoggedIn.next(true)
      return true
   }
    return false
  }

  // async portalRefreshTokens() {
  //   const headers = new HttpHeaders({
  //     'Content-Type': 'application/x-www-form-urlencoded'
  //   })
  //   const params = new HttpParams()
  //   params.set('')
  //   return true
  // }

  portalSyncTransactions() {

    this.settingsService.loadSettings()

    // Try sending request directly to portal.
    // A number of different methods have been proposed and tested to
    // get the user (or Polisy) list of purchased node servers. 
    //   Initialy this was supposed to be handled by a wordpress
    //   plugin in the UDI store but that had security issues and
    //   was replaced with an ISY Portal API.
    //
    // To access the list via the ISY Portal API, we tried:
    //    1) Sending an HTTP(s) request to the PG3 core to retrieve
    //    the list.  However, the browser blocks this because the
    //    PG3 core's server doesn't have an SSL certificiate signed by
    //    an authority.
    //
    //    2) Sending a message to the PG3 core over the MQTT link. This
    //    works, but is asynchronous and we'd have to create an event and
    //    wait for that to get the response. That's complicate.
    //
    //    3) Use the API directly and send the request to the Portal API
    //    here. Initially, the response is blocked by the browser because
    //    of CORS. If we open up the API and have it responde with the
    //    appropriate CORS headers, this should be working.
   
    const headers = new HttpHeaders()
    	.set('Authorization', `Bearer ${this.portalAuth['access_token']}`)
	.set('content-type', 'application/json')

    var host = 'https://my.isy.io/api/nodeserver/list/' + 
    		this.settingsService.settings['macAddress']

    var r = this.http.get(host, {'headers': headers})
    return r
  }

  // 
  // Redirect the browser to the node server purchase page on the 
  // ISY Portal.
  // 
  portalPurchaseNodeServer(nsid) {
    this.settingsService.loadSettings()

    const headers = new HttpHeaders({
      'Authentication': `Bearer ${this.portalAuth['access_token']}`
    })

    var host = 'https://my.isy.io/nodeserver/purchase?nsid=' + nsid + 
    		'&pid=' + this.settingsService.settings['macAddress'] + 
		'&redirect=window.location'

    window.open(host, '_blank')
  }

  //
  //  Notify the ISY Portal that a node server was installed
  //  or uninstalled.  installed should be 'true' or 'false'
  //
  portalNodeServerInstalled(nsid, installed) {
    this.settingsService.loadSettings()

    const headers = new HttpHeaders()
    	.set('Authorization', `Bearer ${this.portalAuth['access_token']}`)
	.set('Content-Type', 'application/x-www-form-urlencoded')

    var host = 'https://my.isy.io/api/nodeserver/update/' + 
    		this.settingsService.settings['macAddress'] + '/' + nsid

    const body = `installed=${installed}`

    return this.http.post(host, body, { headers: headers })
  }

  logout() {
    this.authToken = null
    this.user = null
    localStorage.clear()
    this.isLoggedIn.next(false)
    //this.sockets.stop()
  }

  tokenNotExpired(tokenName, jwt?: string): boolean {
    const token: string = jwt || localStorage.getItem(tokenName)
    const jwtHelper = new JwtHelper()
    return token != null && !jwtHelper.isTokenExpired(token)
  }
}
