const config = require('../../config/config')
const logger = require('../logger')

const core = require('./core')

const apiSwitch = {
  addnode: {
    props: [],
    func: addnode,
    result: resultaddnode,
    batch: resultBatchaddnode,
    type: 'ns'
  },
  removenode: {
    props: [],
    func: sendToISY,
    result: resultremovenode,
    batch: resultBatchremovenode,
    type: 'ns'
  },
  status: {
    props: [],
    func: sendToISY,
    result: resultstatus,
    batch: resultBatchstatus,
    type: 'ns'
  },
  command: {
    props: [],
    func: sendToISY
  },
  batch: {
    props: [],
    func: sendToISY,
    result: resultBatch,
    type: 'ns'
  },
  config: {
    props: [],
    func: config,
    type: 'ns'
  },
  update: {
    props: [],
    func: update,
    type: 'frontend'
  },
  connected: {
    props: [],
    func: connected,
    type: 'frontend'
  },
  customparams: {
    props: [],
    func: updateDatabase,
    type: 'ns',
    attrName: 'customParams'
  },
  customdata: {
    props: [],
    func: updateDatabase,
    type: 'ns',
    attrName: 'customData'
  },
  notices: {
    props: [],
    func: updateDatabase,
    type: 'ns',
    attrName: 'notices'
  },
  polls: {
    props: ['shortPoll', 'longPoll'],
    func: polls,
    type: 'frontend'
  }
}

const checkCommand = type => apiSwitch[type] || null

async function handleResponse() {}

// function makeNodeUrl(uuid, profileNum, path, args = null)
// async function isyGet(uuid, type, url, profileNum = 0)
async function status(isy, profileNum, data, cmd) {}

module.exports = {}
