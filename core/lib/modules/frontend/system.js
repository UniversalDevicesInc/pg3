/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign
  */

async function get() {}
async function set() {}

const API = {
  get: {
    props: ['address'],
    func: get
  },
  set: {
    props: ['address', 'driver', 'value', 'uom'],
    func: set
  }
}

module.exports = { API }
