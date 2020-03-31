const os = require('os')
/**
 * Config data pulled from the .env file
 * and some globally accessible internal variables
 * @module config/config
 * @version 3.0
 */

/**
 * System internal reference variables. Do not touch.
 * @type {Object}
 */
const config = {
  shutdown: false,
  pidFile: null,
  aedes: null,
  db: null,
  mqttServer: null,
  mqttClient: null,
  mqttClientId: 'pg3',
  mqttConnectedClients: {},
  mqttClientDisconnectCallbacks: {},
  mqttClientTails: {}
}

module.exports = config
