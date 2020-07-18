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

async function start(id, cmd, data) {
  const { uuid, profileNum } = data
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    return servicens.startNs(nodeServer)
  } catch (err) {
    logger.error(`start: ${err.stack}`)
  }
  return { error: 'Failed, check log for details.' }
}

async function stop(id, cmd, data) {
  const { uuid, profileNum } = data
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    return servicens.stopNs(nodeServer)
  } catch (err) {
    logger.error(`stop: ${err.stack}`)
  }
  return { error: 'Failed, check log for details.' }
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
  start: {
    props: ['uuid', 'profileNum'],
    func: start
  },
  stop: {
    props: ['uuid', 'profileNum'],
    func: stop
  }
}

module.exports = { API }
