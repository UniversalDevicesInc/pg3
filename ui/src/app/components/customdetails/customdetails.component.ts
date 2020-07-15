import { Component, OnInit, QueryList, ViewChildren } from '@angular/core'

//import { CustomparamComponent } from '../params/customparam/customparam.component'
import { NsdetailsComponent } from '../nsdetails/nsdetails.component'
import { ValidateparamsService } from '../../services/validateparams.service'

@Component({
  selector: 'app-customdetails',
  templateUrl: './customdetails.component.html',
  styleUrls: ['./customdetails.component.css']
})
export class CustomdetailsComponent implements OnInit {

  helpCollapsed = false

  constructor(public nsdetails: NsdetailsComponent,
    private params: ValidateparamsService) {}

  ngOnInit() {
  }

  addCustom(key: string, value) {
    (<HTMLInputElement>document.getElementById('newkey')).value = '';
    (<HTMLInputElement>document.getElementById('newvalue')).value = '';
    this.nsdetails.saveCustom(key, value)
  }

  saveChanges() {
    if (this.params.validate()) {
      this.nsdetails.sendCustom()
      this.nsdetails.sendTypedCustom()
    }
  }

}
