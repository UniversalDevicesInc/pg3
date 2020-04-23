// const config = require('../../config/config')
// const logger = require('../logger')

const core = require('./core')
const u = require('../../utils/utils')

async function setHint(uuid, profileNum, newNode) {
  const path = [
    'nodes',
    core.addNodePrefix(profileNum, newNode.address),
    'set',
    'hint',
    u.convertHint(newNode.hint)
  ]
  await core.isyGet(
    uuid,
    'command',
    core.makeNodeUrl(uuid, profileNum, path),
    profileNum,
    false // retry?
  )
}

async function changeNodeDef(uuid, profileNum, newNode) {
  const path = [
    'nodes',
    core.addNodePrefix(profileNum, newNode.address),
    'change',
    newNode.nodeDefId
  ]
  let args = null
  if (u.isIn(newNode, 'nls')) args = { nls: newNode.nls }
  await core.isyGet(
    uuid,
    'command',
    core.makeNodeUrl(uuid, profileNum, path, args),
    profileNum,
    false // retry?
  )
}

module.exports = { setHint, changeNodeDef }
