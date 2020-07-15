import { ElementRef, ViewChild, Component, OnInit, OnDestroy } from '@angular/core'
import { SettingsService } from '../../services/settings.service'
import { WebsocketsService } from '../../services/websockets.service'
import { NodeServer } from '../../models/nodeserver.model'
import { Router, ActivatedRoute } from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { ConfirmComponent } from '../confirm/confirm.component'
import { FlashMessagesService } from 'angular2-flash-messages'

@Component({
  selector: 'app-nsdetails',
  templateUrl: './nsdetails.component.html',
  styleUrls: ['./nsdetails.component.css']
})
export class NsdetailsComponent implements OnInit, OnDestroy {
  @ViewChild('nslogScroll') private logScrollContainer: ElementRef;

  nodeServers: NodeServer[]
  public mqttConnected = false
  private subConnected: any
  private subNodeServers: any
  private subResponses: any
  private logConn: any
  public logData: string[] = []
  public arrayOfKeys: string[] = []
  public customParams: any
  public customParamsChangePending: boolean
  public typedCustomData: any
  public typedParams: any
  public profileNum: any
  public uptime: any
  public uptimeInterval: any
  public selectedNodeServer: any
  public currentlyEnabled: any
  public autoScroll: boolean
  public child: any

  constructor(
    private sockets: WebsocketsService,
    private settingsService: SettingsService,
    private modal: NgbModal,
    private flashMessage: FlashMessagesService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.arrayOfKeys = []
    this.customParams = {}
    this.customParamsChangePending = false
    this.route.params.subscribe((params) => {
      this.profileNum = params['id']
    })
  }

  ngOnInit() {
    this.autoScroll = true
    this.getConnected()
    this.getNodeServers()
    this.getNodeServerResponses()
  }

  ngOnDestroy() {
    if (this.logConn) {
      this.logConn.unsubscribe()
      if (this.mqttConnected) {
        this.sockets.sendMessage('log', { stop: this.selectedNodeServer.profileNum })
      }
    }
    if (this.subNodeServers) { this.subNodeServers.unsubscribe() }
    if (this.subResponses) { this.subResponses.unsubscribe() }
    if (this.uptimeInterval) { clearInterval(this.uptimeInterval) }
  }

  getConnected() {
    this.subConnected = this.sockets.mqttConnected.subscribe(connected => {
      this.mqttConnected = connected
    })
  }

  showConfirm(nodeServer) {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = 'Delete NodeServer'
    modalRef.componentInstance.body = `This will delete the ${nodeServer.name} NodeServer.
 You will need to restart the ISY admin console to reflect the changes,
 if you are still having problems, click on 'Reboot ISY' above. Are you sure you want to delete?`
    modalRef.result.then((isConfirmed) => {
        if (isConfirmed) {
          this.deleteNodeServer(nodeServer, isConfirmed);
        }
    }).catch((error) => {})
  }

  confirmNodeDelete(i) {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = 'Delete Node?'
    modalRef.componentInstance.body = `This will delete the node: ${i.address} from Polyglot and ISY if it exists. Are you sure?`
    modalRef.result.then((isConfirmed) => {
        if (isConfirmed) {
          this.deleteNode(i);
        }
    }).catch((error) => {})
  }

  deleteNode(i) {
    if (this.mqttConnected) {
      this.sockets.sendMessage('nodeservers',
        {
          removenode: {
            address: i.address, profileNum: this.selectedNodeServer.profileNum
          }
        }, false, true);
    } else {
      this.showDisconnected();
    }
  }

  deleteNodeServer(nodeServer, confirmed) {
    if (this.mqttConnected) {
      this.sockets.sendMessage('nodeservers', {delns: {profileNum: nodeServer.profileNum}})
      this.router.navigate(['/dashboard'])
    } else {
      this.showDisconnected();
    }
  }

  showControl(type) {
    if (this.currentlyEnabled === type) { return this.currentlyEnabled = null }
    this.currentlyEnabled = type

    if (type === 'log') {
      if (this.mqttConnected) {
        this.sockets.sendMessage('log', { start: this.selectedNodeServer.profileNum })
        this.getLog()
      } else {
        this.showDisconnected();
      }
    } else {
      if (this.logConn) {
        this.logConn.unsubscribe()
        if (this.mqttConnected) {
          this.sockets.sendMessage('log', { stop: this.selectedNodeServer.profileNum })
        }
      }
    }
  }

  showDisconnected() {
    this.flashMessage.show('Error not connected to Polyglot.', {
      cssClass: 'alert-danger',
      timeout: 3000})
  }

  getNodeServers() {
    this.subNodeServers = this.sockets.nodeServerData.subscribe(nodeServers => {
      this.nodeServers = nodeServers
      for (const nodeServer of this.nodeServers) {
        if (nodeServer.profileNum === this.profileNum) {
          this.selectedNodeServer = nodeServer
          // If notices is an object, convert to array of values
          if (nodeServer.notices != null && !Array.isArray(nodeServer.notices)) {
            nodeServer.notices = Object.keys(nodeServer.notices).map(key => nodeServer.notices[key]);
          }
          for (const node of nodeServer.nodes) {
            if (Array.isArray(node.hint)) {
              node.hint = node.hint.join('.');
            }
          }
          if (!this.uptimeInterval && this.selectedNodeServer.timeStarted) {
            this.uptimeInterval = setInterval(() => {
              this.calculateUptime()
            }, 1000)
          }
          if (!Array.isArray(nodeServer.typedParams)) {
            nodeServer.typedParams = [];
          }
          const keys = Object.keys(nodeServer.customParams).sort();
          if (!this.customParamsChangePending
              && JSON.stringify(this.arrayOfKeys) !== JSON.stringify(keys)) {
            this.setCustomParams(nodeServer, keys);
          }
          if (JSON.stringify(this.typedParams)
            !== JSON.stringify(nodeServer.typedParams)) {
            this.setTypedCustomData(nodeServer);
          }
        }
      }
    })
  }

  setCustomParams(nodeServer, keys) {
    this.customParams = JSON.parse(JSON.stringify(nodeServer.customParams));
    this.arrayOfKeys = keys;
  }

  setTypedCustomData(nodeServer) {
    if (nodeServer.typedCustomData === null) {
        nodeServer.typedCustomData = {};
    }
    this.typedParams = JSON.parse(JSON.stringify(nodeServer.typedParams));
    this.typedCustomData = JSON.parse(JSON.stringify(nodeServer.typedCustomData));
  }

  calculateUptime() {
    // var seconds = Math.floor(()/1000)
    let d = Math.abs(+ new Date() - this.selectedNodeServer.timeStarted) / 1000
    const r = {}
    const s = {
        'Year(s)': 31536000,
        'Month(s)': 2592000,
        'Week(s)': 604800,
        'Day(s)': 86400,
        'Hour(s)': 3600,
        'Minute(s)': 60,
        'Second(s)': 1
    }

    Object.keys(s).forEach(function(key) {
        r[key] = Math.floor(d / s[key])
        d -= r[key] * s[key]
    })
    let uptime = ''
    for (const key in r) {
      if (r[key] !== 0 ) {
        uptime += `${r[key]} ${key} `
      }
    }
    this.uptime = uptime
  }

  savePolls(shortPoll, longPoll) {
    shortPoll = parseInt(shortPoll, 10);
    longPoll = parseInt(longPoll, 10);
    if (typeof shortPoll === 'number' && typeof longPoll === 'number') {
      if (shortPoll < longPoll) {
        if (this.mqttConnected) {
          const message = {
            shortPoll: shortPoll,
            longPoll: longPoll
          }
          const updatedPolls = JSON.parse(JSON.stringify(message))
          updatedPolls['profileNum'] = this.selectedNodeServer.profileNum
          this.sockets.sendMessage('nodeservers', {polls: updatedPolls}, false, true)
        } else {
          this.badValidate('Websockets not connected to Polyglot. Poll Parameters not saved.')
        }
      } else {
        this.badValidate('shortPoll must be smaller than longPoll')
      }
    } else {
      this.badValidate('Both Poll values must be numbers')
    }
  }

  badValidate(message) {
    this.flashMessage.show(message, {
      cssClass: 'alert-danger',
      timeout: 5000})
    window.scrollTo(0, 0)
  }

  saveCustom(key: string, value) {
    this.customParamsChangePending = true
    this.customParams[key] = value
    this.arrayOfKeys = Object.keys(this.customParams).sort()
  }

  removeCustom(key: string, index) {
    this.arrayOfKeys.splice(index, 1)
    delete this.customParams[key]
  }

  sendCustom() {
    if (this.sockets.connected) {
      // Deepcopy hack
      const updatedParams = JSON.parse(JSON.stringify(this.customParams))
      updatedParams['profileNum'] = this.selectedNodeServer.profileNum
      this.sockets.sendMessage('nodeservers', { customparams: updatedParams },
        false, true)
      this.customParamsChangePending = false
    } else {
      this.badValidate('Websockets not connected to Polyglot. Custom Parameters not saved.');
    }
  }

  sendTypedCustom() {
    if (this.sockets.connected) {
      const data = JSON.parse(JSON.stringify(this.typedCustomData))
      data['profileNum'] = this.selectedNodeServer.profileNum
      this.sockets.sendMessage('nodeservers', { typedcustomdata: data },
        false, true)
    } else {
      this.badValidate('Websockets not connected to Polyglot. Typed Custom Parameters not saved.');
    }
  }

  getLog() {
    if (this.logConn) { return }
    this.logConn = this.sockets.logData.subscribe(data => {
      try {
        const message = data
        if (message.hasOwnProperty('node')) {
          if (message.node === 'polyglot') {
            this.logData.push(data.log)
            if (this.autoScroll) { setTimeout(() => { this.scrollToBottom() }, 100); }
          }
        }
      } catch (e) { }
    })
  }

  sendControl(command) {
    if (this.mqttConnected) {
      const cmd = {
        node: this.selectedNodeServer.profileNum,
      }
      cmd[command] = '';
      this.sockets.sendMessage(this.selectedNodeServer.profileNum, cmd, false, false)
      this.flashMessage.show(`Sent ${command} command to NodeServer ${this.selectedNodeServer.name}.`, {
        cssClass: 'alert-success',
        timeout: 5000})
      window.scrollTo(0, 0)
    }
  }

  getNodeServerResponses() {
    this.subResponses = this.sockets.nodeServerResponse.subscribe(response => {
      if (response.hasOwnProperty('success')) {
        if (response.success) {
          this.flashMessage.show(response.msg, {
            cssClass: 'alert-success',
            timeout: 5000})
          window.scrollTo(0, 0)
        } else {
          this.flashMessage.show(response.msg, {
            cssClass: 'alert-danger',
            timeout: 5000})
          window.scrollTo(0, 0)
        }
      }
    })
  }

  scrollToTop() {
    this.logScrollContainer.nativeElement.scrollTop = 0
  }

  scrollToBottom() {
    this.logScrollContainer.nativeElement.scrollTop = this.logScrollContainer.nativeElement.scrollHeight
  }

}
