/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign
  */

const logger = require('../logger')

const ns = require('../../models/nodeserver')
const servicens = require('../../services/nodeservers')

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
  }
}

module.exports = { API }
