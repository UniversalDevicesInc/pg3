import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { environment } from '../../environments/environment'
import { Title }     from '@angular/platform-browser'

import { Observable } from 'rxjs'


import { finalize, tap } from 'rxjs/operators';

import { saveAs } from 'file-saver'

//import { NodeServer } from '../models/nodeserver.model'


@Injectable()
export class SettingsService {

  authToken: any
  settings: any
  currentNode: any
  isPolisy: boolean = false

  constructor(
    private http: HttpClient,
    private titleService: Title
    ) { }

  loadToken() {
    const token = localStorage.getItem('id_token')
    this.authToken = token
  }

  async savePackage(id) {
    var headers = new HttpHeaders().set('Authorization', localStorage.getItem('id_token'))
    const file = await this.http.get(`${environment.PG_URI}/frontend/log/package/${id}`, { observe: 'response', responseType: "blob", headers: headers }).toPromise()
    this.saveToFileSystem(file)
  }

  async downloadLog(id) {
    var headers = new HttpHeaders().set('Authorization', localStorage.getItem('id_token'))
    const file = await this.http.get(`${environment.PG_URI}/frontend/log/${id}`, { observe: 'response', responseType: "blob", headers: headers }).toPromise()
    this.saveToFileSystem(file)
  }

  saveToFileSystem(response) {
    const contentDispositionHeader: string = response.headers.get('content-disposition')
    const parts: string[] = contentDispositionHeader.split(';')
    const filename = parts[1].split('=')[1]
    const blob = new Blob([response.body])
    saveAs(blob, filename)
  }

  getSettings () {
    this.loadToken()
    const headers = new HttpHeaders({
      Authorization: this.authToken,
      'Content-Type': 'application/json'
    })
    this.http.get(`${environment.PG_URI}/frontend/settings`, {headers: headers})
    .subscribe(settings => {
      this.storeSettings(settings)
    })
  }

  getPolisy() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    })
    this.http.get(`${environment.PG_URI}/frontend/ispolisy`, {headers: headers})
    .subscribe(payload => {
      if (payload && payload.hasOwnProperty('isPolisy')) {
        this.isPolisy = payload['isPolisy']
        this.titleService.setTitle(`${this.isPolisy ? 'Polisy' : 'Polyglot'}`)
      }
    })
  }

  setSettings(settings) {
    this.loadToken()
    const headers = new HttpHeaders({
      Authorization: this.authToken,
      'Content-Type': 'application/json'
    })
    return this.http.post(`${environment.PG_URI}/frontend/settings`, settings, {headers: headers})
  }

  setProfile(profile) {
    this.loadToken()
    const headers = new HttpHeaders({
      Authorization: this.authToken,
      'Content-Type': 'application/json'
    })
    return this.http.post(`${environment.PG_URI}/frontend/settings`, profile, {headers: headers})
  }

  storeSettings(settings) {
    //if (settings.hasOwnProperty('isPolisy')) this.isPolisy = settings['isPolisy']
    localStorage.setItem('settings', JSON.stringify(settings))
  }

  loadSettings() {
    this.settings = JSON.parse(localStorage.getItem('settings'))
    /*
    if (this.settings.hasOwnProperty('isPolisy')) {
      this.isPolisy = this.settings['isPolisy']
      this.titleService.setTitle(`${this.isPolisy ? 'Polisy' : 'Polyglot'}`)
    } */
    return JSON.parse(localStorage.getItem('settings'))
  }

  async downloadBackup() {
    this.loadToken()
    var headers = new HttpHeaders({'Authorization': this.authToken})
    const file = await this.http.get(`${environment.PG_URI}/frontend/backup`, { observe: 'response', responseType: "blob", headers: headers }).toPromise()
    this.saveToFileSystem(file)
  }

  restoreBackup(file) {
    this.loadToken()
    const headers = new HttpHeaders({
      Authorization: this.authToken
    })
    return this.http.post(`${environment.PG_URI}/frontend/restore`, file, { headers: headers })
  }
}
