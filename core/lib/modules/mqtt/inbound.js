const config = require('../../config/config')
const logger = require('../logger')
const u = require('../../utils/utils')

const nscore = require('../nodeserver/core')
const frontcore = require('../frontend/core')

const nsstatus = require('../nodeserver/status')
const nscommand = require('../nodeserver/command')
const nssystem = require('../nodeserver/system')
const nscustom = require('../nodeserver/custom')

const frontendns = require('../frontend/ns')
const frontendisy = require('../frontend/isy')
const frontendsystem = require('../frontend/system')

const apiSwitch = {
  ns: {
    status: nsstatus.API,
    command: nscommand.API,
    system: nssystem.API,
    custom: nscustom.API,
    props: []
  },
  frontend: {
    isy: frontendisy.API,
    system: frontendsystem.API,
    ns: frontendns.API,
    props: []
  }
}

const checkCommand = (type, target) => apiSwitch[type][target] || null

async function processMessage(topic, message) {
  try {
    const [type, target, clientId] = topic.split('/').slice(-3)
    if (!Object.keys(apiSwitch).includes(type)) throw new Error(`API not found ${type}/${target}`)
    const api = checkCommand(type, target)
    if (!api) throw new Error(`API not found ${type}/${target}`)
    const props = u.verifyProps(message, apiSwitch[type].props)
    if (!props.valid)
      throw new Error(
        `Request missing required property: ${props.missing} :: ${JSON.stringify(message)}`
      )
    let id = clientId
    if (!topic.includes(`frontend`)) id = clientId.split('_')
    const results = {}
    await Promise.all(
      Object.keys(api)
        .filter(key => u.isIn(message, key))
        .map(key =>
          config.queue.mqtt
            .schedule(() => api[key].func(id, key, message[key]))
            .then(result => {
              results[key] = result
            })
            .catch(err => {
              logger.error(`MQTT on Inbound processFunction: ${err.stack}`)
            })
        )
    )
    logger.debug(`MQTT Results: [${type}/${target}/${id}] :: ${JSON.stringify(results)}`)
    if (type === 'ns' && Array.isArray(id)) {
      const response = { ...results }
      if (u.isIn(message, 'id')) response.id = message.id
      nscore.sendMessage(id[0], id[1], response)
    } else frontcore.frontendMessage(results)
  } catch (err) {
    logger.error(`MQTT on Inbound processMessage: ${err.stack}`)
  }
}

// function makeNodeUrl(uuid, profileNum, path, args = null)
// async function isyGet(uuid, type, url, profileNum = 0)

module.exports = {
  processMessage
}
