const logger = require('../logger')
const config = require('../../config/config')
const u = require('../../utils/utils')

/**
 * MQTT Once MakeResponse is complete, publish the message to MQTT
 * @method
 * @param {string} topic - topic to publish to. Should be either 'connections' or the profileNum of the NodeServer
 * @param {object} message - Dictionary object of message to send. JSON format.
 * @param {object} options - Typically used for {retain: True/False} to retain the last message. [Optional]
 * @param {function} callback - Callback when publish is complete. [Optional]
 */
function publish(topic, message, options, callback) {
  config.mqttClient.publish(topic, JSON.stringify(message), options, callback)
}

/**
 * MQTT Make Response
 * @method
 * @param {string} topic - topic to publish to. Should be either 'connections' or the profileNum of the NodeServer
 * @param {string} command - Command to send, e.g 'status', etc.
 * @param {object} message - Dictionary object of message to send. JSON format.
 */
function makeResponse(topic, command, message) {
  let fullTopic
  let response
  if (topic === 'connections' || topic === 'udi/polyglot/connections/polyglot') {
    fullTopic = 'udi/polyglot/connections/polyglot'
  } else {
    fullTopic = `udi/polyglot/ns/${topic}`
  }
  try {
    response = { node: 'polyglot' }
    response[command] = message
  } catch (e) {
    response = {
      node: 'polyglot',
      data: {
        error: e
      }
    }
  }
  publish(fullTopic, response)
}

function nsResponse(message, success, msg, extra = null) {
  if (u.isIn(message, 'seq')) {
    const response = {
      node: 'polyglot',
      seq: message.seq,
      response: { success, msg }
    }
    if (extra) {
      response.response = Object.assign(response.response, extra)
    }
    if (response.response.success) {
      logger.debug(`NSResponse: Success: ${response.response.success} - ${response.response.msg}`)
    } else {
      logger.error(`NSResponse: Success: ${response.response.success} - ${response.response.msg}`)
    }
    publish('udi/polyglot/frontend/nodeservers', response)
  }
}

module.exports = {
  makeResponse,
  nsResponse
}
