import {
  AfterViewChecked,
  ElementRef,
  ViewChild,
  Component,
  OnInit,
  OnDestroy
} from '@angular/core'
import { environment } from '../../../environments/environment'
import { Observable, Subscription } from 'rxjs'
import { SettingsService } from '../../services/settings.service'
import { AuthService } from '../../services/auth.service'
import { WebsocketsService } from '../../services/websockets.service'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { ToastrService } from 'ngx-toastr'

@Component({
  selector: 'app-showlog',
  templateUrl: './showlog.component.html',
  styleUrls: ['./showlog.component.css']
})
export class ShowlogComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('logScroll') private logScrollContainer: ElementRef

  private subscription: Subscription = new Subscription()
  public logData: string[] = []
  private logConn: any
  private actionUrl: string
  private headers: Headers
  private websocket: any
  private receivedMsg: any
  private gotFile: boolean = false
  public autoScroll: boolean = true

  constructor(
    public settingsService: SettingsService,
    private sockets: WebsocketsService,
    private auth: AuthService,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    if (!this.gotFile) {
      const headers = new HttpHeaders({ Authorization: `Bearer ${this.auth.authToken}` })
      const logUrl = `${environment.PG_URI}/logs/main`
      this.toastr.success(`Getting Log file...`)
      this.http.get(logUrl, { headers: headers, responseType: 'text' }).subscribe(
        log => {
          if (!log) return
          this.gotFile = true
          this.logData.push(<any>log)
          this.toastr.success(`Got Log file, starting tail...`)
          this.subscription.add(
            this.sockets.logData.subscribe(msg => {
              if (msg) {
                this.logData.push(msg)
                if (this.autoScroll)
                  setTimeout(() => {
                    this.scrollToBottom()
                  }, 100)
              }
            })
          )
          this.sockets.logSub('main')
        },
        err => {
          console.log(err.stack)
          this.toastr.error(`Failed to get Log File ${err.message}`)
        }
      )
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
    this.sockets.logUnSub('main')
  }

  ngAfterViewChecked() {}

  // getLog() {
  //   if (this.logConn) { return }
  //   this.logConn = this.sockets.logData.subscribe(data => {
  //     try {
  //       var message = data
  //       if (message.hasOwnProperty('node')) {
  //         if (message.node === 'polyglot') {
  //           this.logData.push(data.log)
  //           if (this.autoScroll) setTimeout(() => { this.scrollToBottom() }, 100)
  //         }
  //       }
  //     } catch (e) { }
  //   })
  // }

  scrollToTop() {
    this.logScrollContainer.nativeElement.scrollTop = 0
  }

  scrollToBottom() {
    this.logScrollContainer.nativeElement.scrollTop = this.logScrollContainer.nativeElement.scrollHeight
  }

  /*
  public GetInstanceStatus(): Observable<any>{
    var wsURI = environment.WS_URI || 'ws://' + location.hostname + ':' + location.port
    this.websocket = new WebSocket(wsURI + "/ws/udi/polyglot/log")
    this.websocket.onopen =  (evt) => {}

    return Observable.fromEvent(this.websocket, 'message')
      .map(res => res['data'])
  }

  CopyToClipboard(containerid) {
    var range = document.createRange();
     range.selectNode(document.getElementById(containerid));
     window.getSelection().addRange(range);
     document.execCommand("Copy");
     alert("text copied")
   }
   */
}
