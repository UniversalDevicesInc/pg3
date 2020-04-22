/* eslint callback-return: "error" */
const Aedes = require('aedes')
// const fs = require('fs')

const logger = require('../modules/logger')
const config = require('../config/config')
const utils = require('../utils/utils')
const encryption = require('../modules/security/encryption')
const ns = require('../models/nodeserver')
const user = require('../models/user')

/**
 * MQTT Server Start Service.
 * @method
 * @param {function} callback - Callback when connected or if already started.
 */
async function start() {
  if (!config.mqttServer) {
    config.mqttClientKey = encryption.randomString(32)
    logger.info(`Starting MQTT Server Aedes`)

    config.aedes = Aedes({
      id: 'pg3_broker', // Override the broker uuid (used for heartbeat)
      heartbeatInterval: 5000 // 5 seconds, Default is 60 seconds
      // connectTimeout: 3 * 10000 // Default is 30 seconds
    })

    config.aedes.on('client', client => {
      logger.info(`MQTTS: Client Connected: ${client.id}`)
      // console.log(Object.keys(config.aedes.clients))
      config.mqttClientDisconnectCallbacks[client.id] = []
    })

    config.aedes.on('clientDisconnect', client => {
      logger.info(`MQTTS: Client Disconnected: ${client.id}`)
      // console.log(Object.keys(config.aedes.clients))
      if (utils.isIn(config.mqttClientTails, client.id)) {
        config.mqttClientTails[client.id].unwatch()
        delete config.mqttClientTails[client.id]
      }
      if (utils.isIn(config.mqttClientDisconnectCallbacks, client.id)) {
        while (config.mqttClientDisconnectCallbacks[client.id].length > 0) {
          config.mqttClientDisconnectCallbacks[client.id].shift()()
        }
        delete config.mqttClientDisconnectCallbacks[client.id]
      }
    })

    // Debug pings every 10 seconds for each client
    // config.aedes.on('ping', (packet, client) => {
    //   logger.debug(`MQTTS: Client ping: ${client.id}`)
    // })

    config.aedes.on('keepaliveTimeout', client => {
      logger.warn(`MQTTS: keepaliveTimeout: ${client.id}`)
    })

    config.aedes.on('clientError', (client, err) => {
      logger.error(`MQTTS: clientError: ${client.id} ${err.message}`)
    })

    config.aedes.on('connectionError', (client, err) => {
      logger.error(`MQTTS: connectionError: ${client.id} ${err.message}`)
    })

    config.aedes.authenticate = async (client, username, password, callback) => {
      // TODO: Implement authentication to MQTT Server
      const error = new Error(`Auth Error`)
      error.returnCode = 4
      if (Object.keys(config.aedes.clients).includes(client.id)) {
        error.returnCode = 2
        logger.error(
          `MQTTS: ClientID: ${client.id} is already connected. Disallowing multiple connections.`
        )
        return callback(error, null)
      }
      if (!username || !password) return callback(error, false)
      if (client.id === config.mqttClientId)
        return callback(null, password.toString() === config.mqttClientKey)
      if (username === 'debug') return callback(null, true)
      if (client.id.startsWith('pg3frontend'))
        return callback(null, user.checkPassword(username, password.toString()))
      // NodeServers
      const userParts = username.split('_')
      if (userParts.length < 2) return callback(error, null)
      const nodeserver = await ns.get(userParts[0], userParts[1])
      if (nodeserver && client.id === username && password.toString() === nodeserver.token)
        return callback(null, true)
      callback(error, false)
    }

    config.aedes.authorizePublish = (client, packet, callback) => {
      if (client.id === 'debug') return callback(null)
      if (client.id === config.mqttClientId) return callback(null)
      const error = new Error('invalid publish')
      if (client.id.startsWith('pg3frontend')) {
        if (
          packet.topic.includes(`udi/pg3/frontend/`) &&
          !packet.topic.includes(`udi/pg3/frontend/clients/`)
        )
          return callback(null)
        return callback(error)
      }
      if (packet.topic.includes(`udi/pg3/ns/`) && !packet.topic.includes(`udi/pg3/ns/clients/`))
        return callback(null)
      callback(error)
    }

    config.aedes.authorizeSubscribe = (client, sub, callback) => {
      const error = new Error('invalid subscription')
      try {
        if (client.id === 'debug') return callback(null, sub)
        if (client.id === config.mqttClientId) return callback(null, sub)
        const { username } = client.parser.settings
        if (client.id.startsWith('pg3frontend')) {
          if (sub.topic === `udi/pg3/frontend/clients/${username}`) return callback(null, sub)
          return callback(error, null)
        }
        if (sub.topic === `udi/pg3/ns/clients/${client.id}`) return callback(null, sub)
      } catch (err) {
        logger.error(`MQTTS: authorizeSubscribe Error: ${err.stack}`)
      }
      callback(error, null)
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
          logger.info(
            `Aedes MQTT Broker Service: Started on port ${config.globalsettings.mqttPort || 1883}`
          )
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
