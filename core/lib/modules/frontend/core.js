// const logger = require('../logger')
const config = require('../../config/config')
// const u = require('../../utils/utils')

/**
 * MQTT Once MakeResponse is complete, publish the message to MQTT
 * @method
 * @param {string} topic - topic to publish to. Should be either 'connections' or the profileNum of the NodeServer
 * @param {object} message - Dictionary object of message to send. JSON format.
 * @param {object} options - Typically used for {retain: True/False} to retain the last message. [Optional]
 * @param {function} callback - Callback when publish is complete. [Optional]
 */
async function publish(topic, message) {
  return config.mqttClient.publish(topic, JSON.stringify(message))
}

/**
 * MQTT Make Response
 * @method
 * @param {string} topic - topic to publish to. Should be either 'connections' or the profileNum of the NodeServer
 * @param {string} command - Command to send, e.g 'status', etc.
 * @param {object} message - Dictionary object of message to send. JSON format.
 */
async function frontendMessage(message) {
  // if (uuid && type === 'isy')
  //   return publish(`udi/pg3/frontend/clients/${config.globalsettings.id}/${uuid}`, message)
  // if (uuid && profileNum && type === 'ns')
  //   return publish(
  //     `udi/pg3/frontend/clients/${config.globalsettings.id}/${uuid}/${profileNum}`,
  //     message
  //   )
  return publish(`udi/pg3/frontend/clients/${config.globalsettings.id}`, message)
}

module.exports = {
  frontendMessage
}
