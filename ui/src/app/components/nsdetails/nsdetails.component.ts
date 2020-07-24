import { ElementRef, ViewChild, Component, OnInit, OnDestroy } from '@angular/core'
import { SettingsService } from '../../services/settings.service'
import { WebsocketsService } from '../../services/websockets.service'
import { NodeServer } from '../../models/nodeserver.model'
import { Router, ActivatedRoute } from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { ConfirmComponent } from '../confirm/confirm.component'
import { Subscription } from 'rxjs'
import { ToastrService } from 'ngx-toastr'

@Component({
  selector: 'app-nsdetails',
  templateUrl: './nsdetails.component.html',
  styleUrls: ['./nsdetails.component.css']
})
export class NsdetailsComponent implements OnInit, OnDestroy {
  @ViewChild('nslogScroll') private logScrollContainer: ElementRef

  private subscription: Subscription = new Subscription()
  private logConn: any
  public logData: string[] = []
  public arrayOfKeys: string[] = []
  public customParams: any
  public customParamsChangePending: boolean
  public typedCustomData: any
  public typedParams: any
  public uptime: any
  public uptimeInterval: any
  public refreshInterval: any
  public selectedNodeServer: any
  public currentlyEnabled: any
  public autoScroll: boolean
  public child: any

  constructor(
    private sockets: WebsocketsService,
    public settings: SettingsService,
    private modal: NgbModal,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.arrayOfKeys = []
    this.customParams = {}
    this.customParamsChangePending = false
    this.route.params.subscribe(params => {
      const id = params['id'].split('_')
      this.settings.currentNsDetails = {
        uuid: id[0],
        profileNum: id[1]
      }
    })
  }

  ngOnInit() {
    this.autoScroll = true
    this.sockets.sendMessage('ns', { getNs: { ...this.settings.currentNsDetails } })
    if (!this.refreshInterval) {
      this.refreshInterval = setInterval(() => {
        this.sockets.sendMessage('ns', { getNs: { ...this.settings.currentNsDetails } })
      }, 5000)
    }
    this.getNodeServerResponses()
    this.subscription.add(
      this.settings.currentNs.subscribe(ns => {
        if (!ns || !ns.hasOwnProperty('timeStarted')) return
        if (!this.uptimeInterval && ns.timeStarted) {
          this.uptimeInterval = setInterval(() => {
            this.calculateUptime(ns)
          }, 1000)
        }
      })
    )
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
    this.settings.currentNsDetails = null
    if (this.logConn) {
      this.logConn.unsubscribe()
      if (this.sockets.connected) {
        // this.sockets.sendMessage('log', { stop: this.selectedNodeServer.profileNum })
      }
    }
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval)
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  }

  showConfirm(nodeServer) {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = 'Delete NodeServer'
    modalRef.componentInstance.body = `This will delete the ${nodeServer.name} NodeServer.
 You will need to restart the ISY admin console to reflect the changes,
 if you are still having problems, click on 'Reboot ISY' above. Are you sure you want to delete?`
    modalRef.result
      .then(isConfirmed => {
        if (isConfirmed) {
          if (this.sockets.connected) this.deleteNodeServer(nodeServer)
        }
      })
      .catch(error => {})
  }

  confirmNodeDelete(i) {
    const modalRef = this.modal.open(ConfirmComponent, { centered: true })
    modalRef.componentInstance.title = 'Delete Node?'
    modalRef.componentInstance.body = `This will delete the node: ${i.address} from Polyglot and ISY if it exists. Are you sure?`
    modalRef.result
      .then(isConfirmed => {
        if (isConfirmed) {
          if (this.sockets.connected) this.deleteNode(i)
        }
      })
      .catch(error => {})
  }

  deleteNode(i) {
    if (this.sockets.connected) {
      this.sockets.sendMessage(
        'nodeservers',
        {
          removenode: {
            address: i.address,
            profileNum: this.selectedNodeServer.profileNum
          }
        },
        false,
        true
      )
    } else {
      this.showDisconnected()
    }
  }

  deleteNodeServer(nodeServer) {
    this.sockets.sendMessage('isy', { removeNs: nodeServer }, false, false)
    this.toastr.success(`Removing NodeServer: ${nodeServer.name} from slot: ${nodeServer.slot}`)
  }

  showControl(type) {
    if (this.currentlyEnabled === type) {
      return (this.currentlyEnabled = null)
    }
    this.currentlyEnabled = type

    if (type === 'log') {
      if (this.sockets.connected) {
        this.sockets.sendMessage('log', { start: this.selectedNodeServer.profileNum })
        this.getLog()
      } else {
        this.showDisconnected()
      }
    } else {
      if (this.logConn) {
        this.logConn.unsubscribe()
        if (this.sockets.connected) {
          this.sockets.sendMessage('log', { stop: this.selectedNodeServer.profileNum })
        }
      }
    }
  }

  showDisconnected() {
    this.toastr.error('Not connected to Polyglot')
  }

  setCustomParams(nodeServer, keys) {
    this.customParams = JSON.parse(JSON.stringify(nodeServer.customParams))
    this.arrayOfKeys = keys
  }

  setTypedCustomData(nodeServer) {
    if (nodeServer.typedCustomData === null) {
      nodeServer.typedCustomData = {}
    }
    this.typedParams = JSON.parse(JSON.stringify(nodeServer.typedParams))
    this.typedCustomData = JSON.parse(JSON.stringify(nodeServer.typedCustomData))
  }

  calculateUptime(ns) {
    // var seconds = Math.floor(()/1000)
    let d = Math.abs(+new Date() - ns.timeStarted) / 1000
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

    Object.keys(s).forEach(function (key) {
      r[key] = Math.floor(d / s[key])
      d -= r[key] * s[key]
    })
    let uptime = ''
    for (const key in r) {
      if (r[key] !== 0) {
        uptime += `${r[key]} ${key} `
      }
    }
    this.uptime = uptime
  }

  savePolls(shortPoll, longPoll) {
    shortPoll = parseInt(shortPoll, 10)
    longPoll = parseInt(longPoll, 10)
    if (typeof shortPoll === 'number' && typeof longPoll === 'number') {
      if (shortPoll < longPoll) {
        if (this.sockets.connected) {
          const message = {
            shortPoll: shortPoll,
            longPoll: longPoll
          }
          const updatedPolls = JSON.parse(JSON.stringify(message))
          updatedPolls['profileNum'] = this.selectedNodeServer.profileNum
          this.sockets.sendMessage('nodeservers', { polls: updatedPolls }, false, true)
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
    this.toastr.error(message)
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
      this.sockets.sendMessage('nodeservers', { customparams: updatedParams }, false, true)
      this.customParamsChangePending = false
    } else {
      this.badValidate('Websockets not connected to Polyglot. Custom Parameters not saved.')
    }
  }

  sendTypedCustom() {
    if (this.sockets.connected) {
      const data = JSON.parse(JSON.stringify(this.typedCustomData))
      data['profileNum'] = this.selectedNodeServer.profileNum
      this.sockets.sendMessage('nodeservers', { typedcustomdata: data }, false, true)
    } else {
      this.badValidate('Websockets not connected to Polyglot. Typed Custom Parameters not saved.')
    }
  }

  getLog() {
    // if (this.logConn) { return }
    // this.logConn = this.sockets.logData.subscribe(data => {
    //   try {
    //     const message = data
    //     if (message.hasOwnProperty('node')) {
    //       if (message.node === 'polyglot') {
    //         this.logData.push(data.log)
    //         if (this.autoScroll) { setTimeout(() => { this.scrollToBottom() }, 100); }
    //       }
    //     }
    //   } catch (e) { }
    // })
  }

  sendControl(command) {
    if (this.sockets.connected) {
      this.sockets.sendMessage(
        'ns',
        {
          [command]: {
            uuid: this.settings.currentNs.value['uuid'],
            profileNum: this.settings.currentNs.value['profileNum']
          }
        },
        false,
        false
      )
      // this.toastr.success(
      //   `Sent ${command} command to NodeServer ${this.settings.currentNs.value['name']}.`
      // )
      window.scrollTo(0, 0)
    }
  }

  getNodeServerResponses() {
    // this.subResponses = this.sockets.nodeServerResponse.subscribe(response => {
    //   if (response.hasOwnProperty('success')) {
    //     if (response.success) {
    //       this.flashMessage.show(response.msg, {
    //         cssClass: 'alert-success',
    //         timeout: 5000})
    //       window.scrollTo(0, 0)
    //     } else {
    //       this.flashMessage.show(response.msg, {
    //         cssClass: 'alert-danger',
    //         timeout: 5000})
    //       window.scrollTo(0, 0)
    //     }
    //   }
    // })
  }

  scrollToTop() {
    this.logScrollContainer.nativeElement.scrollTop = 0
  }

  scrollToBottom() {
    this.logScrollContainer.nativeElement.scrollTop = this.logScrollContainer.nativeElement.scrollHeight
  }
}
