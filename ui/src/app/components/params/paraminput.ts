export enum ParamType {
  STRING, NUMBER, BOOL
}

export class ParamInput {
  static readonly BOOL_VALUES = {
    'on': true,
    'off': false,
    'true': true,
    'false': false,
    'yes': true,
    'no': false
  };

  name: string;
  title: string;
  defaultValue ?: any;
  type ? = ParamType.STRING;
  desc ? = '';
  isRequired ? = false;
  isList ? = false;
  params ?: [ ParamInput ];

}
