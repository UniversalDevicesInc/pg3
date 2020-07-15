import { Injectable } from '@angular/core'
import * as mqtt from 'mqtt'
import { SettingsService } from './settings.service'
import { AuthService } from './auth.service'
// import { NodeServer } from '../models/nodeserver.model'
// import { Mqttmessage } from '../models/mqttmessage.model'
import { Observable ,  ReplaySubject ,  Subject } from 'rxjs'


@Injectable()
export class WebsocketsService {
  client: any
  id: string

  public connected: boolean = false
  public isyConnected: boolean = false
  public polyglotData: ReplaySubject<any> = new ReplaySubject(1)
  public nodeServerData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyNicsData: ReplaySubject<any> = new ReplaySubject(1)
  public polisySystemData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyNicData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyWifiData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyDatetimeData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyDatetimeAllData: ReplaySubject<any> = new ReplaySubject(1)
  public installedNSData: ReplaySubject<any> = new ReplaySubject(1)
  public settingsData: ReplaySubject<any> = new ReplaySubject(1)
  public nodeServerResponse: Subject<any> = new Subject
  public upgradeData: Subject<any> = new Subject
  public settingsResponse: Subject<any> = new Subject
  public nsTypeResponse: Subject<any> = new Subject
  public mqttConnected: ReplaySubject<boolean> = new ReplaySubject(1)
  public logData: Subject<any> = new Subject
  public nsResponses: Array<any> = new Array
  public setResponses: Array<any> = new Array
  private _seq = Math.floor(Math.random() * 90000) + 10000

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService
  ) {}

  start() {
    if (this.connected) return
    this.settingsService.loadSettings()
    if (!this.id) {
      this.id = 'polyglot_frontend-' + this.randomString(5)
      // this._seq = Math.floor(Math.random() * 90000) + 10000
    }
    let host = location.hostname
    if (!(this.settingsService.settings['mqttHost'] === 'localhost')) {
      host = this.settingsService.settings.mqttHost
    }
    let options = {
      rejectUnauthorized: false,
      clientId: this.id,
      clean: true,
      //reconnectPeriod: 5000,
      //connectTimeout: 30 * 1000,
      username: this.id,
      password: this.settingsService.settings.secret,
    }
    /*options['will'] = {
      topic: 'udi/polyglot/connections/frontend',
      payload: JSON.stringify({node: this.id, connected: false}),
      qos: 0,
      retain: false
    } */
    if (!this.client) {
      this.client = mqtt.connect(`${this.settingsService.settings.useHttps ? 'wss://' : 'ws://'}${host}:${this.settingsService.settings.listenPort || location.port}`, options)
    } else {
      this.client.reconnect()
    }
    this.client.on('connect', () => {
      this.connectionState(true)
      this.client.subscribe('udi/polyglot/connections/polyglot', null)
      this.client.subscribe('udi/polyglot/frontend/#', null)
      this.client.subscribe('udi/polyglot/log/' + this.id, null)
      this.client.subscribe('sconfig/#')
      this.client.subscribe('spolisy/#')
      //this.client.subscribe('udi/polyglot/log/' + this.id, null)
      const message = { connected: true }
      this.sendMessage('connections', message)
    })

    this.client.on('message', (topic, message, packet) => {
      const msg = JSON.parse(message.toString())
      if (topic.startsWith('sconfig') || topic.startsWith('spolisy')) {
        this.processSconfig(topic, msg)
      }
      if (msg.node === undefined || msg.node.substring(0, 18) === 'polyglot_frontend-') { return }
      if (topic === 'udi/polyglot/connections/polyglot') {
        //this.processConnection(msg)
        this.polyglotData.next(msg)
      } else if (topic === 'udi/polyglot/frontend/nodeservers') {
        this.processNodeServers(msg)
      } else if (topic === 'udi/polyglot/frontend/upgrade') {
        //this.processUpgrade(msg)
        this.upgradeData.next(msg)
      } else if (topic === 'udi/polyglot/frontend/settings') {
        this.processSettings(msg)
      } else if (topic === 'udi/polyglot/frontend/log/' + this.id) {
        this.logData.next(msg)
      }
    })

    this.client.on('reconnect', () => {
      this.connectionState(false)
    })

    this.client.on('error', (err) => {
      console.log('MQTT recieved error: ' + err.toString())
      this.connectionState(false)
    })
  }

  sendMessage(topic, message, retained = false, needResponse = false) {
    let msg = null
    if (message !== null) {
      if (topic.startsWith('polisy') || topic.startsWith('config') || topic.startsWith('sconfig') || topic.startsWith('polisy')) {
        msg = JSON.stringify(message)
      } else {
        msg = JSON.stringify(Object.assign({node: this.id}, message, needResponse ? {seq: this._seq} : undefined))
      }
    }
    if (needResponse) {
      if (topic === 'settings') {
        this.setResponses.push(JSON.parse(msg))
      } else if (topic === 'nodeservers') {
        this.nsResponses.push(JSON.parse(msg))
      }
      this._seq++
    }

    if (topic === 'connections') { topic = 'udi/polyglot/connections/frontend'
    } else if (topic === 'settings') { topic = 'udi/polyglot/frontend/settings'
    } else if (topic === 'upgrade') { topic = 'udi/polyglot/frontend/upgrade'
    } else if (topic === 'nodeservers') { topic = 'udi/polyglot/frontend/nodeservers'
    } else if (topic === 'log') { topic = 'udi/polyglot/frontend/log'
    } else if (topic.startsWith('config/') || topic.startsWith('sconfig/') || topic.startsWith('polisy/')) {
    } else { topic = 'udi/polyglot/ns/' + topic }
    //packet.destinationName = topic
    //packet.retained = retained
    this.client.publish(topic, msg, { qos: 0, retained: retained})
  }

  stop() {
    this.sendMessage('connections', {connected: false})
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

  /*
  processLog(message) {
    this.getLog(message)
  }

  getLog(message) {
    Observable.of(message).subscribe(data => this.logData.next(data))
    return this.logData
  }


  processConnection(message) {
    this.getPolyglot(message)
  }


  getPolyglot(message) {
    Observable.of(message).subscribe(data => this.polyglotData.next(data))
    return this.polyglotData
  } */

  processNodeServers(message) {
    if (message.hasOwnProperty('response') && message.hasOwnProperty('seq')) {
        this.nsResponses.forEach((item) => {
          if (item.seq === message.seq) {
            //this.nodeServerResponses(message)
            this.nodeServerResponse.next(message.response)
            return
          }
        })
    } else if (message.hasOwnProperty('nodetypes')) {
      //this.nsTypeResponses(message)
      this.nsTypeResponse.next(message.nodetypes)
    } else if (message.hasOwnProperty('installedns')) {
      //this.getinstalledNS(message)
      this.installedNSData.next(message.installedns)
    } else {
      //this.getNodeServers(message)
      this.nodeServerData.next(message.nodeservers)
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
    if (message.hasOwnProperty('response') && message.hasOwnProperty('seq')) {
        this.setResponses.forEach((item) => {
          if (item.seq === message.seq) {
            //this.settingsResponses(message)
            this.settingsResponse.next(message.response)
            //return
          }
        })
    } else {
      if (message.settings.hasOwnProperty('isyConnected')) this.isyConnected = message.settings.isyConnected
      //this.getSettings(message)
      this.settingsData.next(message.settings)
    }
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
