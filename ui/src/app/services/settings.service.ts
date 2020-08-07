import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { environment } from '../../environments/environment'
import { Title } from '@angular/platform-browser'
import { ToastrService } from 'ngx-toastr'

import { Observable, BehaviorSubject } from 'rxjs'

import { finalize, tap } from 'rxjs/operators'

import { saveAs } from 'file-saver'

//import { NodeServer } from '../models/nodeserver.model'

@Injectable()
export class SettingsService {
  public authToken: any
  public settings: any
  public currentNsDetails: object = {}
  public isPolisy: boolean = false
  public currentIsy: BehaviorSubject<object> = new BehaviorSubject(null)
  public currentNs: BehaviorSubject<any> = new BehaviorSubject(null)
  public currentNodeServers: BehaviorSubject<any[]> = new BehaviorSubject([])
  public globalSettings: BehaviorSubject<object> = new BehaviorSubject(null)
  // public isys: any[] = []
  // public nodeServers: any[] = []
  public availableNodeServerSlots: any[] = []

  constructor(
    private http: HttpClient,
    private titleService: Title,
    private toastr: ToastrService
  ) {}

  loadToken() {
    const token = localStorage.getItem('id_token')
    this.authToken = token
  }

  async savePackage(id) {
    this.loadToken()
    var headers = new HttpHeaders({ Authorization: `Bearer ${this.authToken}` })
    const file = await this.http
      .get(`${environment.PG_URI}/frontend/log/package/${id}`, {
        observe: 'response',
        responseType: 'blob',
        headers: headers
      })
      .toPromise()
    this.saveToFileSystem(file)
  }

  async downloadLog(id) {
    this.loadToken()
    var headers = new HttpHeaders({ Authorization: `Bearer ${this.authToken}` })
    this.toastr.success(`Downloading Log File. Please wait.`)
    const file = await this.http
      .get(`${environment.PG_URI}/logs/download/${id}`, {
        observe: 'response',
        responseType: 'blob',
        headers: headers
      })
      .toPromise()
    this.saveToFileSystem(file)
  }

  saveToFileSystem(response) {
    const contentDispositionHeader: string = response.headers.get('content-disposition')
    const parts: string[] = contentDispositionHeader.split(';')
    const filename = parts[1].split('=')[1]
    const blob = new Blob([response.body])
    saveAs(blob, filename)
  }

  getPolisy() {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    })
    this.http
      .get(`${environment.PG_URI}/frontend/ispolisy`, { headers: headers })
      .subscribe(payload => {
        if (payload && payload.hasOwnProperty('isPolisy')) {
          this.isPolisy = payload['isPolisy'] ? true : false
          this.titleService.setTitle(`${this.isPolisy ? 'Polisy' : 'Polyglot'}`)
        }
      })
  }

  storeSettings(settings) {
    //if (settings.hasOwnProperty('isPolisy')) this.isPolisy = settings['isPolisy']
    localStorage.setItem('settings', JSON.stringify(settings))
    this.settings = settings
    this.globalSettings.next(settings)
  }

  loadSettings() {
    this.settings = JSON.parse(localStorage.getItem('settings'))
    this.globalSettings.next(this.settings)
    /*
    if (this.settings.hasOwnProperty('isPolisy')) {
      this.isPolisy = this.settings['isPolisy']
      this.titleService.setTitle(`${this.isPolisy ? 'Polisy' : 'Polyglot'}`)
    } */
    return JSON.parse(localStorage.getItem('settings'))
  }

  async downloadBackup() {
    this.loadToken()
    var headers = new HttpHeaders({ Authorization: `Bearer ${this.authToken}` })
    const file = await this.http
      .get(`${environment.PG_URI}/frontend/backup`, {
        observe: 'response',
        responseType: 'blob',
        headers: headers
      })
      .toPromise()
    this.saveToFileSystem(file)
  }

  restoreBackup(file, v2: boolean = false) {
    this.loadToken()
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authToken}`
    })
    let url = `${environment.PG_URI}/frontend/${v2 ? 'restoreFrom2' : 'restore'}`
    if (v2) url += `?uuid=${this.currentIsy.value['uuid']}`
    console.log(url)
    return this.http.post(url, file, { headers: headers })
  }
}
