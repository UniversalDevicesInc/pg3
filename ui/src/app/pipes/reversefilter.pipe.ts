import { Injector, Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'reversefilter'
})
export class ReversefilterPipe implements PipeTransform {
  public constructor(private readonly injector: Injector) {}

  transform(nodeServers: Array<any>, uuid: string): any {
    //     ns                    uuid     cuuid
    // if (!items1 || !items2 || !field1 || !value1 || !field2 || !value2) return items
    // const filtered = items.filter(it => it[field1].indexOf(value1) !== -1)
    // return filtered.filter(it => it[field2].indexOf(value2) === -1)
    const isy = nodeServers.filter(ns => ns.uuid === uuid)
    const available = new Array(25).fill(1).map((x, i) => i + 1)
    isy.map(ns => {
      available[ns.profileNum - 1] = null
    })
    return available
  }
}
