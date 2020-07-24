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
const nodeserver = require('../../services/nodeservers')

async function config([uuid, profileNum], cmd, data) {
  return ns.getFull(uuid, profileNum)
}

async function connected(message) {
  console.log(message)
}

async function polls(message) {
  console.log(message)
}

async function installprofile([uuid, profileNum], cmd, data) {
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    // await isyNodeServer.profileUpload(uuid, profileNum)
  } catch (err) {
    logger.error(`installprofile error: ${err.stack}`)
  }
}

async function stop(message) {
  console.log(message)
}

async function restart(message) {
  console.log(message)
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
    props: ['shortPoll', 'longPoll'],
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
  }
}

module.exports = { API }
