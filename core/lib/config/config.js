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
  httpClient: {},
  httpServer: null,
  mqttClient: null,
  mqttServer: null,
  mqttClientId: 'pg3_client',
  mqttConnectedClients: {},
  mqttClientDisconnectCallbacks: {},
  mqttClientTails: {},
  queue: {}
}

module.exports = config
