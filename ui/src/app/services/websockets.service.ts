import { Injectable } from '@angular/core'
import * as mqtt from 'mqtt'
import { Observable, ReplaySubject, BehaviorSubject, Subject, Subscription } from 'rxjs'

import { ToastrService } from 'ngx-toastr'

import { SettingsService } from './settings.service'
import { AuthService } from './auth.service'
import { ThrowStmt } from '@angular/compiler'
// import { NodeServer } from '../models/nodeserver.model'
// import { Mqttmessage } from '../models/mqttmessage.model'

@Injectable()
export class WebsocketsService {
  private subscription: Subscription = new Subscription()
  public mqttConnected: ReplaySubject<boolean> = new ReplaySubject(1)
  public installNs: Subject<object> = new Subject()
  public removeNs: Subject<object> = new Subject()
  public discoverIsys: Subject<object> = new Subject()
  public getIsys: BehaviorSubject<any[]> = new BehaviorSubject(null)
  public addIsy: Subject<object> = new Subject()
  public updateIsy: Subject<object> = new Subject()
  public removeIsy: Subject<object> = new Subject()
  public invalidCredentials: Subject<object> = new Subject()
  public getNodeServers: BehaviorSubject<object> = new BehaviorSubject([])
  public getSettings: BehaviorSubject<object> = new BehaviorSubject(null)
  public setSettings: BehaviorSubject<object> = new BehaviorSubject(null)
  public reboot: Subject<object> = new Subject()
  public nsUpdate: BehaviorSubject<object> = new BehaviorSubject(null)
  public notification: BehaviorSubject<object> = new BehaviorSubject(null)
  public polisyNicsData: ReplaySubject<any> = new ReplaySubject(1)
  public polisySystemData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyNicData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyWifiData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyDatetimeData: ReplaySubject<any> = new ReplaySubject(1)
  public polisyDatetimeAllData: ReplaySubject<any> = new ReplaySubject(1)
  public installedNSData: ReplaySubject<any> = new ReplaySubject(1)
  private topics: any[] = []
  private _currentIsy = null
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
      keepalive: 5,
      clientId: this.id,
      clean: false,
      reconnectPeriod: 5000,
      resubscribe: true,
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
      this.topics = [
        `udi/pg3/frontend/clients/${this.settingsService.settings.id}`,
        `sconfig/#`,
        `spolisy/#`
      ]
      this.client.subscribe(this.topics)
      // this.client.subscribe(`udi/pg3/frontend/clients/${this.settingsService.settings.id}/#`)
      this.addSubscribers()
      this.sendMessage('system', { getIsys: {}, getSettings: {} })
    })

    this.client.on('message', (topic, message, packet) => {
      const msg = JSON.parse(message.toString())
      console.log(`${topic} :: ${message.toString()}`)
      if (topic.startsWith('sconfig') || topic.startsWith('spolisy')) {
        this.processSconfig(topic, msg)
      }
      Object.keys(msg).map(key => {
        if (this[key]) this[key].next(msg[key])
      })
    })

    this.client.on('reconnect', () => {
      console.log(`MQTT reconnect`)
      this.connectionState(false)
      this.subscription.unsubscribe()
    })

    this.client.on('disconnect', () => {
      console.log(`MQTT disconnected`)
      this.connectionState(false)
      this.subscription.unsubscribe()
    })

    this.client.on('error', err => {
      console.log('MQTT recieved error: ' + err.toString())
      this.connectionState(false)
      this.subscription.unsubscribe()
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

  addSubscribers() {
    // currentIsy Subscriber
    // this.subscription.add(
    //   this.settingsService.currentIsy.subscribe(currentIsy => {
    //     if (currentIsy && currentIsy.hasOwnProperty('uuid')) {
    //       if (!this._currentIsy || this._currentIsy['uuid'] !== currentIsy['uuid']) {
    //         this._currentIsy = currentIsy
    //         // const index = this.topics.findIndex(e => e.includes(`/00:21`))
    //         // if (index > -1) {
    //         //   console.log(`unsub ${this.topics[index]}`)
    //         //   this.client.unsubscribe(this.topics[index])
    //         //   this.topics.splice(index, 1)
    //         // }
    //         // const isyTopic = `udi/pg3/frontend/clients/${this.settingsService.settings.id}/${currentIsy['uuid']}`
    //         // if (this.topics.indexOf(isyTopic) === -1) {
    //         //   this.topics.push(isyTopic)
    //         //   console.log(`sub ${isyTopic}`)
    //         //   this.client.subscribe(isyTopic)
    //         // }
    //         this.sendMessage('isy', { getNodeServers: { uuid: currentIsy['uuid'] } })
    //       }
    //     }
    //   })
    // )

    // getNodeServers Subscriber
    this.subscription.add(
      this.getNodeServers.subscribe((nodeservers: any[]) => {
        if (Array.isArray(nodeservers)) {
          this.settingsService.currentNodeServers.next(nodeservers)
          // this.settingsService.availableNodeServerSlots = {}
          // nodeservers.map(item => {
          //   if (!u.isIn(this.settingsService.availableNodeServerSlots, item.uuid)) {
          //     this.settingsService.availableNodeServerSlots[item.uuid] = []
          //   }
          // })
          // nodeservers.map(item => {
          //   this.settingsService.availableNodeServerSlots.splice(item.profileNum - 1, 1)
          // })
        }
      })
    )

    // getSettings Subscriber
    this.subscription.add(
      this.getSettings.subscribe(settings => {
        if (!settings) return
        this.settingsService.globalSettings.next(settings)
        this.settingsService.storeSettings(settings)
      })
    )
    // setSettings Subscriber
    this.subscription.add(
      this.setSettings.subscribe(settings => {
        if (!settings) return
        this.settingsService.globalSettings.next(settings)
        this.settingsService.storeSettings(settings)
      })
    )

    // System returns
    this.subscription.add(
      this.installNs.subscribe(ns => {
        if (!ns) return
        if (ns.hasOwnProperty('success') && ns['success']) {
          this.toastr.success(
            `NodeServer ${ns['name']} was installed into slot ${ns['profileNum']} successfully!`
          )
          this.sendMessage('isy', {
            getNodeServers: { uuid: this.settingsService.currentIsy.value['uuid'] }
          })
        } else {
          this.toastr.error(
            `NodeServer install of ${ns['name']} failed with message: ${ns['error']}`
          )
        }
      })
    )
    this.subscription.add(
      this.removeNs.subscribe(ns => {
        if (!ns) return
        if (ns.hasOwnProperty('success') && ns['success']) {
          this.toastr.success(
            `NodeServer ${ns['name']} was removed from slot ${ns['profileNum']} successfully!`
          )
          this.sendMessage('isy', {
            getNodeServers: { uuid: this.settingsService.currentIsy.value['uuid'] }
          })
        } else {
          this.toastr.error(
            `Failed to remove NodeServer ${ns['name']} from slot ${ns['profileNum']}: ${ns['error']}`
          )
        }
      })
    )
    this.subscription.add(
      this.reboot.subscribe(msg => {
        if (!msg) return
        if (msg.hasOwnProperty('success') && msg['success']) {
          this.toastr.success(
            `Reboot command successful for ${this.settingsService.currentIsy.value['name']}(${this.settingsService.currentIsy.value['uuid']})`
          )
        } else {
          this.toastr.error(
            `Failed to send reboot to ${this.settingsService.currentIsy.value['name']}(${this.settingsService.currentIsy.value['uuid']}): ${msg['error']}`
          )
        }
      })
    )
    this.subscription.add(
      this.discoverIsys.subscribe(msg => {
        if (!msg) return
        if (msg.hasOwnProperty('success') && msg['success']) {
          this.toastr.success(
            `Discovery successful! Found ISY at ${msg['ip']} with the UUID of ${msg['uuid']}`
          )
          this.sendMessage('system', { getIsys: {} })
        } else {
          this.toastr.error(`${msg['error']}`)
        }
      })
    )
    this.subscription.add(
      this.getIsys.subscribe(msg => {
        if (!msg) return
        console.log('getIsys')
        if (Array.isArray(msg)) {
          this.toastr.success(`Successfully retrieved ISY's from database`)
          if (msg.length <= 0) {
            localStorage.removeItem('currentIsy')
            return this.settingsService.currentIsy.next(null)
          }
          const currentIsy =
            localStorage.getItem('currentIsy') ||
            JSON.parse(localStorage.getItem('profile')).preferredIsy
          const isy = msg.filter(it => it['uuid'] === currentIsy)
          if (isy.length > 0) {
            console.log(`Found preferredIsy: ${isy[0]['name']} (${isy[0]['uuid']})`)
            localStorage.setItem('currentIsy', isy[0]['uuid'])
            this.settingsService.currentIsy.next(isy[0])
          } else {
            console.log(`No preferred ISY Found.Using ${msg[0]['name']} (${msg[0]['uuid']})`)
            localStorage.setItem('currentIsy', msg[0]['uuid'])
            this.settingsService.currentIsy.next(msg[0])
          }
          this.sendMessage('isy', { getNodeServers: { uuid: currentIsy['uuid'] } })
        } else {
          this.toastr.error(`${msg['error']}`)
        }
      })
    )
    this.subscription.add(
      this.addIsy.subscribe(msg => {
        if (!msg) return
        if (msg.hasOwnProperty('success') && msg['success']) {
          this.toastr.success(`ISY add successful! Added: ${msg['name']}(${msg['uuid']})`)
          this.sendMessage('system', { getIsys: {} })
        } else {
          this.toastr.error(`${msg['error']}`)
        }
      })
    )
    this.subscription.add(
      this.updateIsy.subscribe(msg => {
        if (!msg) return
        if (msg.hasOwnProperty('success') && msg['success']) {
          this.toastr.success(`ISY update successful! Updated: ${msg['uuid']}`)
          this.sendMessage('system', { getIsys: {} })
        } else {
          this.toastr.error(`${msg['error']}`)
        }
      })
    )
    this.subscription.add(
      this.removeIsy.subscribe(msg => {
        if (!msg) return
        if (msg.hasOwnProperty('success') && msg['success']) {
          this.toastr.success(`ISY removed successfully! Removed: ${msg['uuid']}`)
          this.sendMessage('system', { getIsys: {} })
        } else {
          this.toastr.error(`${msg['error']}`)
        }
      })
    )
    this.subscription.add(
      this.invalidCredentials.subscribe(msg => {
        if (!msg) return
        this.toastr.error(`Invalid Credentials for ISY ${msg['uuid']}. Please update.`)
      })
    )
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
