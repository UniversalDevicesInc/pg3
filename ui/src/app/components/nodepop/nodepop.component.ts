import { Component, Input } from '@angular/core'
import { DriverpopComponent } from '../driverpop/driverpop.component'

@Component({
  selector: 'app-nodepop',
  templateUrl: './nodepop.component.html',
  styleUrls: ['./nodepop.component.css']
})
export class NodepopComponent {

  @Input() node: any
  selectedDrivers: any
  selectedRow: any

  showDrivers(drivers, i) {
    if (this.selectedDrivers === drivers) {
      this.selectedRow = null
      return this.selectedDrivers = null }
    this.selectedDrivers = drivers
    this.selectedRow = i

  }

}
