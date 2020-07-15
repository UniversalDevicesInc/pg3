import { ParamInput, ParamType } from './paraminput';

export class Param {

  validate(): boolean {
    return true;
  }

  valudateValue(desc: ParamInput, value: any): any {
    if (desc.isRequired && (value == null || value === '')) {
      return [ false, value, 'Value cannot be empty' ];
    }
    let type
    if (desc.type === null) {
      type = ParamType.STRING
    } else {
      type = ParamType[desc.type]
    }
    //const type = desc.type === null ? ParamType.STRING : ParamType[desc.type]
    if (type === ParamType.NUMBER) {
      if ((+value) + '' === value + '') {
        value = +value;
      } else {
        return [ false, value, 'Numeric value is required' ];
      }
    } else if (type === ParamType.BOOL) {
      const boolValue = ParamInput.BOOL_VALUES[value + ''.toLowerCase()];
      if (boolValue == null) {
        return [ false, value, 'Boolean value is required' ];
      } else {
        value = boolValue
      }
    }

    return [ true, value, null ];
  }
}
