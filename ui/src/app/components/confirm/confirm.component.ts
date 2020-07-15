import { Component, OnInit, Input } from '@angular/core'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.css']
})

export class ConfirmComponent implements OnInit  {
  @Input() title
  @Input() body

  constructor(
    public activeModal: NgbActiveModal,
  ) { }

  ngOnInit() {
  }

  cancel() {
    this.activeModal.close(false)
  }

  confirm() {
    this.activeModal.close(true)
  }
}
