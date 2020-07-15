import { Component, OnInit, Input } from '@angular/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-modal-ns-update',
  templateUrl: './modal-ns-update.component.html',
  styleUrls: ['./modal-ns-update.component.css']
})

export class ModalNsUpdateComponent implements OnInit {
  @Input() title
  @Input() body

  constructor(
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit() {
  }

  confirm() {
    // on click on confirm button we set dialog result as true,
    // ten we can get dialog result from caller code
    this.activeModal.close(true)
  }

  deny() {
    this.activeModal.close(false)
  }

  cancel() {
    this.activeModal.close(null)
  }
}
