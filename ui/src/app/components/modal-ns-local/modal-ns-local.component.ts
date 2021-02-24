import { Component, OnInit, Input } from '@angular/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { SettingsService } from '../../services/settings.service'

@Component({
  selector: 'app-modal-ns-local',
  templateUrl: './modal-ns-local.component.html',
  styleUrls: ['./modal-ns-local.component.css']
})

export class ModalNsLocalComponent implements OnInit {
  @Input() title
  @Input() body
  nslink = null
  nsname = null
  selectedSlot = 0
  constructor(
    public activeModal: NgbActiveModal,
    public settingsService: SettingsService
  ) {}

  ngOnInit() {
  }

  submit() {
    // on click on confirm button we set dialog result as true,
    // ten we can get dialog result from caller code
    this.activeModal.close([this.nslink, this.selectedSlot, this.nsname])
  }

  cancel() {
    this.activeModal.dismiss()
  }

}
