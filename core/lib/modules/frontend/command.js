/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign
  */

const servicens = require('../../services/nodeservers')

async function nsinstall(id, cmd, data) {
  return servicens.createNs(data)
}
async function nsremove(id, cmd, data) {
  return servicens.removeNs(data)
}

async function nschangebranch(id, cmd, data) {}

async function nsget(id, cmd, data) {
  return servicens.getNs(data)
}

async function nsgetall(id, cmd, data) {
  return servicens.getAllNs(data)
}

const API = {
  nsinstall: {
    props: ['uuid', 'name', 'profileNum', 'url'],
    func: nsinstall
  },
  nsremove: {
    props: ['uuid', 'name', 'profileNum'],
    func: nsremove
  },
  nschangebranch: {
    props: ['uuid', 'profileNum', 'branch'],
    func: nschangebranch
  },
  nsget: {
    props: ['uuid', 'profileNum'],
    func: nsget
  },
  nsgetall: {
    props: ['uuid'],
    func: nsgetall
  }
}

module.exports = { API }
