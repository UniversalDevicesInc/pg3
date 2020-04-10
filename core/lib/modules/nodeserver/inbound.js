const config = require('../../config/config')
const logger = require('../logger')
const u = require('../../utils/utils')

// const core = require('./core')
const status = require('./status')
const command = require('./command')
const system = require('./system')
const custom = require('./custom')

const apiSwitch = {
  ns: {
    status: status.API,
    command: command.API,
    system: system.API,
    custom: custom.API
  },
  frontend: {
    system: '',
    settings: ''
  }
}

const checkCommand = (type, target) => apiSwitch[type][target] || null

async function processMessage(topic, message) {
  try {
    const coreKeys = ['uuid', 'profileNum']
    const props = u.verifyProps(message, coreKeys)
    if (!props.valid)
      return logger.error(
        `Request missing required property: ${props.missing} :: ${JSON.stringify(message)}`
      )
    const [type, target] = topic.split('/').slice(-2)
    if (!Object.keys(apiSwitch).includes(type))
      return logger.error(`API not found ${type}/${target}`)
    const api = checkCommand(type, target)
    Object.keys(message)
      .filter(key => !coreKeys.includes(key))
      .map(key => {
        const missing = u.verifyProps(message, api[key].props)
        if (!missing.valid)
          return logger.error(
            `Request missing required property: ${missing.missing} :: ${JSON.stringify(
              message[key]
            )}`
          )
        return config.queue.mqtt
          .schedule(() => {
            return api[key].func(message)
          })
          .catch(err => {
            logger.error(`MQTT on Inbound processFunction: ${err.stack}`)
          })
      })
    return logger.debug(`Process`)
  } catch (err) {
    return logger.error(`MQTT on Inbound processMessage: ${err.stack}`)
  }
}

// function makeNodeUrl(uuid, profileNum, path, args = null)
// async function isyGet(uuid, type, url, profileNum = 0)

module.exports = {
  processMessage
}
