const logger = require('../logger')
// const config = require('../../config/config')

const core = require('./core')
// const u = require('../../utils/utils')

async function request(uuid, profileNum, data) {
  const path = ['report', 'request', data.requestId, data.success ? 'success' : 'fail']
  await core.isyGet(
    uuid,
    'command',
    core.makeNodeUrl(uuid, profileNum, path),
    profileNum,
    false // retry?
  )
  logger.debug(`Sent response for RequestID: ${data.requestId}. Success: ${data.success}`)
}

module.exports = {
  request
}
