/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign
  */
const logger = require('../logger')
const u = require('../../utils/utils')

const frontcore = require('../core')
const servicens = require('../../services/nodeservers')

async function nsinstall(id, cmd, data) {
  console.log(id, cmd, data)
}
async function set() {}

const API = {
  nsinstall: {
    props: ['uuid', 'name', 'profileNum', 'url'],
    func: nsinstall
  },
  nsremove: {
    props: ['address', 'driver', 'value', 'uom'],
    func: set
  },
  nschangebranch: {
    props: ['address', 'driver', 'value', 'uom'],
    func: set
  },
  nsconfig: {
    props: ['address', 'driver', 'value', 'uom'],
    func: set
  }
}

module.exports = { API }
