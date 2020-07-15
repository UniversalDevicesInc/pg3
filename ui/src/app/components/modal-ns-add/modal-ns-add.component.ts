import { Component, OnInit, Input } from '@angular/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-modal-ns-add',
  templateUrl: './modal-ns-add.component.html',
  styleUrls: ['./modal-ns-add.component.css']
})

export class ModalNsAddComponent implements OnInit {
  @Input() title
  @Input() body

  nslink = null
  constructor(
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit() {
  }

  submit() {
    // on click on confirm button we set dialog result as true,
    // ten we can get dialog result from caller code
    this.activeModal.close(this.nslink)
  }

  cancel() {
    this.activeModal.dismiss()
  }

}
