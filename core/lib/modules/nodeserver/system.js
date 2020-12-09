/* eslint-disable
  no-use-before-define,
  no-unused-vars
  */
const logger = require('../logger')
const u = require('../../utils/utils')

const isy = require('../isy/core')
const isyNodeServer = require('../isy/nodeserver')
const isyErrors = require('../isy/errors')
const ns = require('../../models/nodeserver')
const nsservice = require('../../services/nodeservers')

async function config([uuid, profileNum], cmd, data) {
  return ns.getFull(uuid, profileNum)
}

async function connected([uuid, profileNum], cmd, data) {
  logger.warn(`Connected message no longer used. PG3 tracks client connection state internally.`)
  return { success: false, error: `DEPRECATED! PLEASE DISCONTINUE USE` }
}

async function polls([uuid, profileNum], cmd, data) {
  const { short, long } = data
  try {
    await ns.update(uuid, profileNum, { shortPoll: short, longPoll: long })
    const currentNs = await ns.get(uuid, profileNum)
    await nsservice.stopPolls(currentNs)
    await nsservice.startPolls(currentNs)
    return { success: true }
  } catch (err) {
    logger.error(`polls: ${err.stack}`)
    return { success: false, error: `${err.message}` }
  }
}

async function installprofile([uuid, profileNum], cmd, data) {
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    await nsservice.installProfile(nodeServer)
    return { success: true }
  } catch (err) {
    logger.error(`installprofile error: ${err.stack}`)
    return { success: false, error: err.message }
  }
}

async function stop([uuid, profileNum], cmd, data) {
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    return nsservice.stopNs(nodeServer)
  } catch (err) {
    logger.error(`stopNs: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}

async function restart([uuid, profileNum], cmd, data) {
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    return nsservice.restartNs(nodeServer)
  } catch (err) {
    logger.error(`restartNs: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}

async function setloglevel([uuid, profileNum], cmd, data) {
  const { level } = data
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    nodeServer.logLevel = level
    await ns.update(uuid, profileNum, { logLevel: level })
    return nsservice.sendLogLevel(nodeServer)
  } catch (err) {
    logger.error(`setLogLevel: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}

const API = {
  config: {
    props: [],
    func: config
  },
  connected: {
    props: [],
    func: connected
  },
  polls: {
    props: ['short', 'long'],
    func: polls
  },
  installprofile: {
    props: [],
    func: installprofile
  },
  stop: {
    props: [],
    func: stop
  },
  restart: {
    props: [],
    func: restart
  },
  setLogLevel: {
    props: ['level'],
    func: setloglevel
  }
}

module.exports = { API }
