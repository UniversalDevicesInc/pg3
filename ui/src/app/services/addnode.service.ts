import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'

import { Subject } from 'rxjs'

@Injectable()
export class AddnodeService {

  authToken: any
  settings: any
  public upgradeSubject: Subject<any> = new Subject

  //upgradeAvailable$ = this.upgradeSubject.asObservable()

  constructor(
    private http: HttpClient
  ) { }

  submitNewNS(url) {
    //var submitURL = 'https://8skwp2eayd.execute-api.us-east-1.amazonaws.com/prod/add'
    var submitURL = 'https://pgcstore.isy.io/v1/add'
    let headers = new HttpHeaders({'Content-Type': 'application/json'})
    let httpOptions = { headers: headers }
    const body = JSON.stringify({url: url})
    return this.http.post(submitURL, body, httpOptions)
  }

  getNSList() {
    var nsIndexURL = 'https://pgcstore.isy.io/v1/list?sort'
    const headers = new HttpHeaders()
    return this.http.get(nsIndexURL, {headers: headers})
  }

  getPolyglotVersion() {
    try {
      this.settings = JSON.parse(localStorage.getItem('settings'))
      var polyglotVersionDoc
      if (this.settings.useBeta) {
        polyglotVersionDoc = 'https://s3.amazonaws.com/polyglotv2/binaries/beta/beta.json'
      } else {
        polyglotVersionDoc = 'https://s3.amazonaws.com/polyglotv2/binaries/current.json'
      }
      //var polyglotPackage = 'https://raw.githubusercontent.com/UniversalDevicesInc/polyglot-v2/master/package.json'
      const headers = new HttpHeaders()
      this.http.get(polyglotVersionDoc, {headers: headers})
        .subscribe(doc => this.upgradeSubject.next(doc))
        //.subscribe(doc => this.checkUpgrade(doc))
    } catch (err) {
      console.log(err)
    }
  }

  /*
  checkUpgrade(message) {
    this.upgradeSubject.next(message)
  } */

}
