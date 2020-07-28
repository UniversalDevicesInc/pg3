import { Injector, Pipe, PipeTransform } from '@angular/core'

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  public constructor(private readonly injector: Injector) {}

  transform(items: Array<any>, field: string, value: string): any {
    if (!items || !field || !value) return items
    return items.filter(it => it[field] === value)
  }
}
