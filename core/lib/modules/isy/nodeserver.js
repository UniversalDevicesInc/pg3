// const config = require('../../config/config')
const logger = require('../logger')
const config = require('../../config/config')

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
    data.cmd
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

async function profileUpload(uuid, profileNum, type, filename, data) {
  try {
    const url = core.makeSystemUrl(uuid, [
      'rest',
      'ns',
      'profile',
      profileNum,
      'upload',
      type,
      `${filename}`
    ])
    const options = {}
    const res = await core.isyPost(uuid, 'command', url, data, options, profileNum, true)
    if (res && res.status === 200) {
      logger.info(`upload successful`)
    } else {
      logger.info(`upload not successful`)
    }
  } catch (err) {
    logger.error(`ISY: profileUpload - ${err.stack}`)
  }
}

async function installNodeServer(nodeServer) {
  const { uuid, profileNum } = nodeServer
  var ret = true
  try {
    const args = {
      ip: config.globalsettings.ipAddress,
      baseurl: `/ns/${uuid}_${profileNum}`,
      name: nodeServer.name,
      nsuser: uuid,
      nspwd: nodeServer.token,
      isyusernum: 0,
      port: config.globalsettings.listenPort,
      timeout: 0,
      // eslint-disable-next-line no-unneeded-ternary
      ssl: config.globalsettings.secure ? true : false,
      enabled: true,
      sni: true
    }
    const res = await core.isyGet(
      uuid,
      'system',
      core.makeSystemUrl(uuid, [`rest/profiles/ns/${profileNum}/connection/set/network`], args),
      0,
      true
    )
    if (res && res.status === 200) {
      logger.info(`[${uuid}_${profileNum}] '${nodeServer.name}' installed into ISY successfully...`)
    }
  } catch (err) {
    logger.error(`installNodeServer :: ${err.stack}`)
    ret = false
  }
  return ret
}

async function removeNodeServer(nodeServer) {
  const { uuid, profileNum } = nodeServer
  try {
    const res = await core.isyGet(
      uuid,
      'system',
      core.makeSystemUrl(uuid, [`rest/profiles/ns/${profileNum}/connection/remove`]),
      0,
      true
    )
    if (res && res.status === 200) {
      logger.info(`[${uuid}_${profileNum}] '${nodeServer.name}' removed from ISY successfully...`)
    }
  } catch (err) {
    logger.error(`removeNodeServer :: ${err.stack}`)
  }
}

module.exports = {
  setHint,
  changeNodeDef,
  sendCommand,
  profileUpload,
  installNodeServer,
  removeNodeServer
}
