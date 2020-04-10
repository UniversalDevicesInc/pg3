const config = require('../../config/config')
const logger = require('../logger')

const core = require('./core')

async function processMessage(message) {
  const props = core.verifyProps(message, ['uuid', 'profileNum'])
}

const apiSwitch = {
  addnode: {
    props: [],
    func: 'addnode'
  },
  removenode: {
    props: [],
    func: 'sendToISY'
  },
  status: {
    props: [],
    func: 'sendToISY'
  },
  command: {
    props: [],
    func: 'sendToISY'
  },
  batch: {
    props: [],
    func: 'sendToISY'
  },
  config: {
    props: [],
    func: 'config'
  },
  update: {
    props: [],
    func: 'update'
  },
  connected: {
    props: [],
    func: 'connected'
  },
  customparams: {
    props: [],
    func: ''
  },
  customdata: {
    props: [],
    func: ''
  },
  notices: {
    props: [],
    func: 'updateDatabase'
  },
  polls: {
    props: ['shortPoll', 'longPoll'],
    func: 'polls'
  }
}

const checkCommand = type => apiSwitch[type] || null

// function makeNodeUrl(uuid, profileNum, path, args = null)
// async function isyGet(uuid, type, url, profileNum = 0)

module.exports = {}
