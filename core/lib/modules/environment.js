const logger = require('./logger')
const config = require('../config/config')

const globalsettings = require('../models/globalsettings')

/**
 * Environment Module
 * @module modules/environment
 * @version 3.0
 */

const OVERRIDES = {
  mqttHost: 'PG3MQTTHOST',
  mqttPort: 'PG3MQTTPORT',
  ipAddress: 'PG3IP',
  bindIpAddress: 'PG3BINDIP',
  listenPort: 'PG3LISTENPORT',
  secure: 'PG3SECURE',
  customCerts: 'PG3CUSTOMCERTS',
  beta: 'PG3BETA',
  polisy: 'POLISY'
}

async function start() {
  let changed = false
  // Update the start time in the database
  globalsettings.update({ timeStarted: Date.now() })
  await Promise.all(
    Object.entries(OVERRIDES).map(([key, value]) => {
      if (value in process.env) {
        let updateValue = process.env[value]
        if (
          updateValue === false ||
          (typeof updateValue === 'string' && updateValue.toLowerCase() === 'false')
        )
          updateValue = 0
        if (
          updateValue === true ||
          (typeof updateValue === 'string' && updateValue.toLowerCase() === 'true')
        )
          updateValue = 1
        changed = true
        return globalsettings.update(key, updateValue)
      }
      return false
    })
  )
  if (changed) {
    logger.info(`Updated configuration with overrides`)
    config.globalsettings = await globalsettings.get()
  }
}

// API
module.exports = { start }
