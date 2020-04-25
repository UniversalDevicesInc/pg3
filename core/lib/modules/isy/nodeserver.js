// const config = require('../../config/config')
// const logger = require('../logger')

const core = require('./core')
const u = require('../../utils/utils')

async function setHint(uuid, profileNum, data) {
  const path = [
    'nodes',
    core.addNodePrefix(profileNum, data.address),
    'set',
    'hint',
    u.convertHint(data.hint)
  ]
  await core.isyGet(
    uuid,
    'command',
    core.makeNodeUrl(uuid, profileNum, path),
    profileNum,
    false // retry?
  )
}

async function changeNodeDef(uuid, profileNum, data) {
  const path = ['nodes', core.addNodePrefix(profileNum, data.address), 'change', data.nodeDefId]
  let args = null
  if (u.isIn(data, 'nls')) args = { nls: data.nls }
  await core.isyGet(
    uuid,
    'command',
    core.makeNodeUrl(uuid, profileNum, path, args),
    profileNum,
    false // retry?
  )
}

async function sendCommand(uuid, profileNum, data) {
  const path = [
    'nodes',
    core.addNodePrefix(profileNum, data.address),
    'report',
    'cmd',
    data.command
  ]
  if (u.isIn(data, 'value')) {
    path.push(data.value)
    if (u.isIn(data, 'uom')) path.push(data.uom)
  }
  let args = null
  if (u.isIn(data, 'params')) {
    if (!Array.isArray(data.params)) throw new Error(`params must be an array`)
    args = {}
    data.params.forEach(param => {
      if (u.isIn(param, 'param') && u.isIn(param, 'uom') && u.isIn(param, 'value'))
        args[`${param.param}.${param.uom}`] = param.value
    })
    if (Object.keys(args).length <= 0) args = null
  }
  await core.isyGet(
    uuid,
    'command',
    core.makeNodeUrl(uuid, profileNum, path, args),
    profileNum,
    true // retry?
  )
}

module.exports = { setHint, changeNodeDef, sendCommand }
