// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
import { version } from '../../package.json'
import { TestBed } from '@angular/core/testing'

export const environment = {
  production: false,
  PG_URI: 'https://polyglot:3000',
  WS_URI: 'wss://polyglot:3000',
  STAGE: 'test',
  VERSION: version
}
