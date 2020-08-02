/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign
  */

const logger = require('../logger')

const ns = require('../../models/nodeserver')
const servicens = require('../../services/nodeservers')
const custom = require('../../models/custom')
const nscustom = require('../nodeserver/custom')
const nscommand = require('../nodeserver/command')

async function getNs(id, cmd, data) {
  return servicens.getNs(data)
}

async function getNodes(id, cmd, data) {
  return servicens.getNodes(data)
}

async function startNs(id, cmd, data) {
  const { uuid, profileNum } = data
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    return servicens.startNs(nodeServer)
  } catch (err) {
    logger.error(`startNs: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}

async function stopNs(id, cmd, data) {
  const { uuid, profileNum } = data
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    return servicens.stopNs(nodeServer)
  } catch (err) {
    logger.error(`stopNs: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}

async function restartNs(id, cmd, data) {
  const { uuid, profileNum } = data
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    return servicens.restartNs(nodeServer)
  } catch (err) {
    logger.error(`restartNs: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}

async function removeNode(id, cmd, data) {
  const { uuid, profileNum, address } = data
  const response = await nscommand.removenode([uuid, profileNum], 'removenode', [{ address }])
  if (Array.isArray(response)) return response[0]
  return response
}

async function updateNotices(id, cmd, data) {
  const { uuid, profileNum, notices } = data
  try {
    await custom.add(uuid, profileNum, 'notices', JSON.stringify(notices))
    return { success: true }
  } catch (err) {
    logger.error(`updateNotices: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}

async function getCustom(id, cmd, data) {
  const { uuid, profileNum, keys } = data
  return nscustom.get([uuid, profileNum], 'get', keys)
}

async function setCustom(id, cmd, data) {
  const { uuid, profileNum, keys } = data
  return nscustom.set([uuid, profileNum], 'set', keys)
}

async function setPolls(id, cmd, data) {
  const { uuid, profileNum, short, long } = data
  try {
    await ns.update(uuid, profileNum, { shortPoll: short, longPoll: long })
    const currentNs = await ns.get(uuid, profileNum)
    await servicens.stopPolls(currentNs)
    await servicens.startPolls(currentNs)
    return { success: true }
  } catch (err) {
    logger.error(`setPolls: ${err.stack}`)
    return { success: false, error: `${err.message}` }
  }
}

const API = {
  getNs: {
    props: ['uuid', 'profileNum'],
    func: getNs
  },
  getNodes: {
    props: ['uuid', 'profileNum'],
    func: getNodes
  },
  startNs: {
    props: ['uuid', 'profileNum'],
    func: startNs
  },
  stopNs: {
    props: ['uuid', 'profileNum'],
    func: stopNs
  },
  restartNs: {
    props: ['uuid', 'profileNum'],
    func: restartNs
  },
  removeNode: {
    props: ['uuid', 'profileNum', 'address'],
    func: removeNode
  },
  updateNotices: {
    props: ['uuid', 'profileNum', 'notices'],
    func: updateNotices
  },
  getCustom: {
    props: ['uuid', 'profileNum', 'keys'],
    func: getCustom
  },
  setCustom: {
    props: ['uuid', 'profileNum', 'keys'],
    func: setCustom
  },
  setPolls: {
    props: ['uuid', 'profileNum', 'short', 'long'],
    func: setPolls
  }
}

module.exports = { API }
