import { Injectable } from '@angular/core'
import * as mqtt from 'mqtt'
import { Observable, ReplaySubject, BehaviorSubject, Subject } from 'rxjs'

import { ToastrService } from 'ngx-toastr'

import { SettingsService } from './settings.service'
import { AuthService } from './auth.service'
// import { NodeServer } from '../models/nodeserver.model'
// import { Mqttmessage } from '../models/mqttmessage.model'

@Injectable()
export class WebsocketsService {
  public mqttConnected: ReplaySubject<boolean> = new ReplaySubject(1)
  public getIsys: BehaviorSubject<object> = new BehaviorSubject(null)
  public getNodeServers: BehaviorSubject<object> = new BehaviorSubject(null)
  public nsUpdate: BehaviorSubject<object> = new BehaviorSubject(null)
  public notification: BehaviorSubject<object> = new BehaviorSubject(null)
  public polisyNicsData: ReplaySubject<any> = new ReplaySubject(1)
  public polisySystemData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyNicData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyWifiData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyDatetimeData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyDatetimeAllData: ReplaySubject<any> = new ReplaySubject(1)
  public installedNSData: ReplaySubject<any> = new ReplaySubject(1)
  public connected = false

  private _seq = Math.floor(Math.random() * 90000) + 10000
  private client: any
  private id: string
  private url: string

  constructor(
    private authService: AuthService,
    private toastr: ToastrService,
    private settingsService: SettingsService
  ) {}

  start() {
    console.log(`Starting MQTT Service`)
    if (this.connected) return
    this.settingsService.loadSettings()
    this.authService.loadToken()
    if (!this.id) {
      this.id = 'pg3frontend_' + this.randomString(5)
      // this._seq = Math.floor(Math.random() * 90000) + 10000
    }
    let host = location.hostname
    if (!(this.settingsService.settings['mqttHost'] === 'localhost')) {
      host = this.settingsService.settings.mqttHost
    }
    let options = {
      rejectUnauthorized: false,
      clientId: this.id,
      clean: false,
      // reconnectPeriod: 5000,
      // connectTimeout: 30 * 1000,
      username: this.authService.user,
      password: localStorage.getItem('id_token')
    }
    /*options['will'] = {
      topic: 'udi/polyglot/connections/frontend',
      payload: JSON.stringify({node: this.id, connected: false}),
      qos: 0,
      retain: false
    } */
    if (!this.client) {
      this.url = `${this.settingsService.settings.secure ? 'wss://' : 'ws://'}${host}:${
        this.settingsService.settings.listenPort || location.port
      }`
      this.client = mqtt.connect(this.url, options)
    } else {
      this.client.reconnect()
    }
    this.client.on('connect', () => {
      console.log(`MQTT connected to ${this.url}`)
      this.connectionState(true)
      this.client.subscribe(`udi/pg3/frontend/clients/${this.authService.user}`, null)
      this.client.subscribe(`udi/pg3/frontend/clients/${this.authService.user}/#`, null)
      this.client.subscribe('sconfig/#')
      this.client.subscribe('spolisy/#')
      this.sendMessage('system', { getIsys: {} })
    })

    this.client.on('message', (topic, message, packet) => {
      const msg = JSON.parse(message.toString())
      if (topic.startsWith('sconfig') || topic.startsWith('spolisy')) {
        this.processSconfig(topic, msg)
      }
      Object.keys(msg).map(key => {
        if (this[key]) this[key].next(msg[key])
      })
      if (topic.endsWith(this.authService.user)) {
        // this.polyglotData.next(msg)
      } else if (topic === 'udi/polyglot/frontend/nodeservers') {
        this.processNodeServers(msg)
      } else if (topic === 'udi/polyglot/frontend/settings') {
        this.processSettings(msg)
      } else if (topic === 'udi/polyglot/frontend/log/' + this.id) {
        // this.logData.next(msg)
      }
    })

    this.client.on('reconnect', () => {
      this.connectionState(false)
    })

    this.client.on('error', err => {
      console.log('MQTT recieved error: ' + err.toString())
      this.connectionState(false)
    })
  }

  sendMessage(topic, message, retained = false, needResponse = false) {
    let msg = JSON.stringify(Object.assign(message, needResponse ? { seq: this._seq } : undefined))
    if (needResponse) {
      if (topic === 'settings') {
        // this.setResponses.push(JSON.parse(msg))
      } else if (topic === 'nodeservers') {
        // this.nsResponses.push(JSON.parse(msg))
      }
      this._seq++
    }

    topic = `udi/pg3/frontend/${topic}/${this.authService.user}`
    this.client.publish(topic, msg, { qos: 0, retained: retained })
  }

  stop() {
    // this.sendMessage('connections', { connected: false })
    this.client.end()
    this.client = null
    this.connectionState(false)
    this.connected = false
  }

  randomString(length) {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }

  connectionState(newState: boolean) {
    this.connected = newState
    this.mqttConnected.next(newState)
  }

  processNodeServers(message) {
    if (message.hasOwnProperty('response') && message.hasOwnProperty('seq')) {
      // this.nsResponses.forEach(item => {
      //   if (item.seq === message.seq) {
      //     //this.nodeServerResponses(message)
      //     this.nodeServerResponse.next(message.response)
      //     return
      //   }
      // })
    } else if (message.hasOwnProperty('nodetypes')) {
      //this.nsTypeResponses(message)
      // this.nsTypeResponse.next(message.nodetypes)
    } else if (message.hasOwnProperty('installedns')) {
      //this.getinstalledNS(message)
      // this.installedNSData.next(message.installedns)
    } else {
      //this.getNodeServers(message)
      //this.nodeServerData.next(message.nodeservers)
    }
  }

  processSconfig(topic, message) {
    if (topic === 'sconfig/network/nics') {
      this.polisyNicsData.next(message)
    } else if (topic.startsWith('sconfig/network/nic/')) {
      this.polisyNicData.next(message)
    } else if (topic === 'sconfig/datetime') {
      this.polisyDatetimeData.next(message)
    } else if (topic === 'sconfig/datetime/all') {
      this.polisyDatetimeAllData.next(message)
    } else if (topic === 'sconfig/network/wifi/networks') {
      this.polisyWifiData.next(message)
    } else if (topic.startsWith('spolisy/')) {
      this.polisySystemData.next(message)
    }
  }

  /*
  getNodeServers(message) {
    Observable.of(message.nodeservers).subscribe(data => this.nodeServerData.next(data))
    return this.nodeServerData
  }

  getinstalledNS(message) {
    Observable.of(message.installedns).subscribe(data => this.installedNSData.next(data))
    return this.installedNSData
  }

  nodeServerResponses(message) {
    Observable.of(message.response).subscribe(data => this.nodeServerResponse.next(data))
    return this.nodeServerResponse
  }

  nsTypeResponses(message) {
    Observable.of(message.nodetypes).subscribe(data => this.nsTypeResponse.next(data))
    return this.nsTypeResponse
  } */

  processSettings(message) {
    // if (message.hasOwnProperty('response') && message.hasOwnProperty('seq')) {
    //   this.setResponses.forEach(item => {
    //     if (item.seq === message.seq) {
    //       //this.settingsResponses(message)
    //       this.settingsResponse.next(message.response)
    //       //return
    //     }
    //   })
    // } else {
    //   if (message.settings.hasOwnProperty('isyConnected'))
    //     this.isyConnected = message.settings.isyConnected
    //   //this.getSettings(message)
    //   this.settingsData.next(message.settings)
    // }
  }

  /*
  getSettings(message) {
    Observable.of(message.settings).subscribe(data => this.settingsData.next(data))
    return this.settingsData
  }


  settingsResponses(message) {
    Observable.of(message.response).subscribe(data => this.settingsResponse.next(data))
    return this.settingsData
  }

  processUpgrade(message) {
    this.getUpgrade(message)
  }

  getUpgrade(message) {
    Observable.of(message).subscribe(data => this.upgradeData.next(data))
    return this.upgradeData
  } */
}
