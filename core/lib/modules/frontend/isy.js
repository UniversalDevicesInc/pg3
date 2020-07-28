/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign
  */

const servicens = require('../../services/nodeservers')

async function installNs(id, cmd, data) {
  return servicens.createNs(data)
}
async function removeNs(id, cmd, data) {
  return servicens.removeNs(data)
}

async function changeNsBranch(id, cmd, data) {}

async function getNodeServers(id, cmd, data) {
  return servicens.getAllNs(data)
}

const API = {
  installNs: {
    props: ['uuid', 'name', 'profileNum', 'url'],
    func: installNs
  },
  removeNs: {
    props: ['uuid', 'name', 'profileNum'],
    func: removeNs
  },
  changeNsBranch: {
    props: ['uuid', 'name', 'profileNum', 'branch'],
    func: changeNsBranch
  },
  getNodeServers: {
    props: ['uuid'],
    func: getNodeServers
  }
}

module.exports = { API }
