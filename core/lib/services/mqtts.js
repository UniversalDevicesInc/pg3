const Aedes = require('aedes')
const fs = require('fs')

const logger = require('../modules/logger')
const config = require('../config/config')
const utils = require('../utils/utils')
/**
 * MQTT Server Start Service.
 * @method
 * @param {function} callback - Callback when connected or if already started.
 */
async function start() {
  if (!config.mqttSerice) {
    logger.info(`Starting MQTT Server Aedes`)
    config.aedes = Aedes({
      heartbeatInterval: 5000,
      connectTimeout: 10 * 10000
    })

    config.aedes.on('client', client => {
      logger.info(`MQTTS: Client Connected: ${client.id}`)
      config.mqttConnectedClients[client.id] = {}
      config.mqttClientDisconnectCallbacks[client.id] = []
    })

    config.aedes.on('clientDisconnect', client => {
      logger.info(`MQTTS: Client Disconnected: ${client.id}`)
      if (utils.hasOwn(config.mqttConnectedClients, client.id)) {
        delete config.mqttConnectedClients[client.id]
      }
      if (utils.hasOwn(config.mqttClientTails, client.id)) {
        config.mqttClientTails[client.id].unwatch()
        delete config.mqttClientTails[client.id]
      }
      if (utils.hasOwn(config.mqttClientDisconnectCallbacks, client.id)) {
        while (config.mqttClientDisconnectCallbacks[client.id].length > 0) {
          config.mqttClientDisconnectCallbacks[client.id].shift()()
        }
        delete config.mqttClientDisconnectCallbacks[client.id]
      }
    })

    config.aedes.on('clientError', (client, err) => {
      logger.error(`MQTTS: clientError: ${client.id} ${err.message}`)
    })

    config.aedes.on('connectionError', (client, err) => {
      logger.error(`MQTTS: connectionError: ${client.id} ${err.message}`)
    })

    config.aedes.on('keepaliveTimeout', client => {
      logger.error(`MQTTS: keepaliveTimeout: ${client.id}`)
    })

    config.aedes.authenticate = (client, username, password, callback) => {
      // TODO: Implement authentication to MQTT Server
      if (utils.hasOwn(config.mqttConnectedClients, client.id)) {
        logger.error(`Client already connected. Disallowing multiple connections from the same client. ${client.id}`)
        callback(null, false)
      } else {
        if (client.id === 'polyglot' || client.id.substring(0, 18) === 'polyglot_frontend-') {
          if (username && password) {
            if (password.toString() === config.globalsettings.secret) {
              logger.info(`MQTTS: ${client.id} authenticated successfully.`)
              callback(null, true)
            } else {
              logger.error(`MQTTS: ${client.id} authentication failed. Someone is messing with something....`)
              callback(null, true)
            }
          } else {
            logger.error(`Polyglot or Frontend didn't provide authentication credentials. Disallowing access.`)
            callback(null, false)
          }
        }
        callback(null, true)
      }
    }

    config.aedes.authorizePublish = (client, packet, callback) => {
      callback(null)
    }

    config.aedes.authorizeSubscribe = (client, sub, callback) => {
      callback(null, sub)
    }

    if (config.globalsettings.secure) {
      const key = config.sslData.private
      const { cert } = config.sslData
      config.mqttServer = require('tls').createServer(
        {
          rejectUnauthorized: false,
          key,
          cert
        },
        config.aedes.handle
      )
    } else {
      config.mqttServer = require('net').createServer(config.aedes.handle)
    }

    return new Promise((resolve, reject) => {
      try {
        config.mqttServer.listen(config.globalsettings.mqttPort || 1883, () => {
          logger.info(`Aedes MQTT Broker Service: Started on port ${config.globalsettings.mqttPort || 1883}`)
          resolve()
        })
      } catch (err) {
        reject(err)
      }
    })
  }
  return new Error(`MQTTS Already Running`)
}

/**
 * MQTT Server Stop Service
 * @method
 * @param {function} callback - Callback when service is and conneciton is clear.
 */
async function stop() {
  if (config.mqttServer) {
    logger.info('Aedes MQTT Broker Service: Stopping')
    config.mqttServer.close()
    config.mqttServer = null
  }
}

// API
module.exports = { start, stop }
