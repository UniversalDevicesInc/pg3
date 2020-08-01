import { ElementRef, ViewChild, Component, OnInit, OnDestroy } from '@angular/core'
import { SettingsService } from '../../services/settings.service'
import { WebsocketsService } from '../../services/websockets.service'
import { NodeServer } from '../../models/nodeserver.model'
import { Router, ActivatedRoute } from '@angular/router'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { ConfirmComponent } from '../confirm/confirm.component'
import { Subscription } from 'rxjs'
import { ToastrService } from 'ngx-toastr'
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms'

@Component({
  selector: 'app-nsdetails',
  templateUrl: './nsdetails.component.html',
  styleUrls: ['./nsdetails.component.css']
})
export class NsdetailsComponent implements OnInit, OnDestroy {
  @ViewChild('nslogScroll') private logScrollContainer: ElementRef

  private subscription: Subscription = new Subscription()
  public objectValues = Object.values
  public objectKeys = Object.keys
  private logConn: any
  public logData: string[] = []
  public jsonParse = item => JSON.parse(item)
  public arrayOfKeys: string[] = []
  public customParams: any
  public customParamsChangePending: boolean
  public _typedCustomData: string = ''
  public typedCustomData: object = {}
  public typedParams: any[] = []
  public uptime: any
  public uptimeInterval: any
  public refreshInterval: any
  public selectedNodeServer: any
  public currentlyEnabled: any
  public autoScroll: boolean
  public child: any
  customparamsForm: FormGroup
  // customtypedparamsForm: FormGroup
  submitted = false

  constructor(
    public sockets: WebsocketsService,
    public settings: SettingsService,
    private fb: FormBuilder,
    private modal: NgbModal,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.customparamsForm = this.fb.group({
      customparams: new FormArray([])
    })
    // this.customtypedparamsForm = this.fb.group({
    //   customtypedparams: new FormArray([])
    // })
    this.route.params.subscribe(params => {
      const id = params['id'].split('_')
      this.settings.currentNsDetails = {
        uuid: id[0],
        profileNum: parseInt(id[1], 10)
      }
    })
    this.autoScroll = true
    this.sockets.sendMessage('ns', { getNs: { ...this.settings.currentNsDetails } })
    if (!this.refreshInterval) {
      this.refreshInterval = setInterval(() => {
        this.sockets.sendMessage('ns', { getNs: { ...this.settings.currentNsDetails } })
      }, 5000)
    }
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
    // getCustom Subscriber
    this.subscription.add(
      this.sockets.getCustom.subscribe(custom => {
        if (!Array.isArray(custom)) return
        if (this.customparamsForm.dirty) return
        custom.map(entry => {
          if (entry.key === 'customparams') {
            try {
              const params = JSON.parse(entry.value)
              Object.entries(params).map(([key, value]) => {
                ;(this.customparamsForm.controls.customparams as FormArray).push(
                  this.fb.group({
                    key: [key, Validators.required],
                    value: [value, Validators.required]
                  })
                )
              })
              // console.log(this.customparamsForm.controls.customparams['controls'])
            } catch (err) {
              console.log(`customparams value is not json parseable`)
            }
          }
          if (entry.key === 'customtypedparams') {
            try {
              const params = JSON.parse(entry.value)
              if (!Array.isArray(params)) return
              this.typedParams = params
            } catch (err) {
              console.log(`customtypedparams value is not json parseable`)
            }
          }
          if (entry.key === 'customtypeddata') {
            try {
              const params = JSON.parse(entry.value)
              this._typedCustomData = JSON.stringify(params)
              this.typedCustomData = params
            } catch (err) {
              console.log(`customtypeddata value is not json parseable`)
            }
          }
        })
      })
    )
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
    this.settings.currentNsDetails = {}
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

  // convenience getters for easy access to form fields
  // get f() {
  //   return this.dynamicForm.controls
  // }
  // get t() {
  //   return this.f.tickets as FormArray
  // }

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
          removeNode: {
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
    this.toastr.success(
      `Removing NodeServer: ${nodeServer.name} from slot: ${nodeServer.profileNum}`
    )
    this.router.navigate(['/dashboard'])
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
            setPolls: {
              uuid: this.settings.currentNsDetails['uuid'],
              profileNum: this.settings.currentNsDetails['profileNum'],
              short: shortPoll,
              long: longPoll
            }
          }
          this.sockets.sendMessage('ns', message)
        } else {
          this.toastr.error('Websockets not connected to Polyglot. Poll Parameters not saved.')
        }
      } else {
        this.toastr.error('shortPoll must be smaller than longPoll')
      }
    } else {
      this.toastr.error('Both Poll values must be numbers')
    }
    window.scrollTo(0, 0)
  }

  addCustom(form) {
    ;(this[`${form}Form`].controls[form] as FormArray).push(
      this.fb.group({
        key: ['', Validators.required],
        value: ['', Validators.required]
      })
    )
  }

  saveCustom() {
    if (this.sockets.connected) {
      const message = {
        setCustom: {
          uuid: this.settings.currentNsDetails['uuid'],
          profileNum: this.settings.currentNsDetails['profileNum'],
          keys: []
        }
      }
      let customparams = {}
      let customtypedparams = {}
      if (this.customparamsForm.dirty) {
        this.customparamsForm.value.customparams.map(cp => {
          customparams[cp['key']] = cp['value']
        })
        message.setCustom.keys.push({ key: 'customparams', value: customparams })
      }
      if (this._typedCustomData !== JSON.stringify(this.typedCustomData)) {
        message.setCustom.keys.push({ key: 'customtypeddata', value: this.typedCustomData })
      }
      if (message.setCustom.keys.length > 0) {
        this.sockets.sendMessage('ns', message)
        this.toastr.success(`Saving updated customs`)
      } else {
        this.toastr.error(`No changes detected`)
      }
    } else {
      this.toastr.error('Not connected. Custom Parameters not saved.')
    }
  }

  removeCustom(form, index) {
    ;(this[`${form}Form`].controls[form] as FormArray).removeAt(index)
  }

  refreshCustom() {
    this.customparamsForm.markAsPristine()
    // this.customtypedparamsForm.markAsPristine()
    ;(this.customparamsForm.controls.customparams as FormArray).clear()
    // ;(this.customtypedparamsForm.controls.customtypedparams as FormArray).clear()
    if (this.sockets.connected)
      this.sockets.sendMessage('ns', {
        getCustom: {
          uuid: this.settings.currentNsDetails['uuid'],
          profileNum: this.settings.currentNsDetails['profileNum'],
          keys: [
            { key: 'customparams' },
            { key: 'customparamsdoc' },
            { key: 'customtypedparams' },
            { key: 'customtypeddata' }
          ]
        }
      })
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

  scrollToTop() {
    this.logScrollContainer.nativeElement.scrollTop = 0
  }

  scrollToBottom() {
    this.logScrollContainer.nativeElement.scrollTop = this.logScrollContainer.nativeElement.scrollHeight
  }
}
