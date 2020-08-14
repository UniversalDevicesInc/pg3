/* eslint callback-return: "error" */
/* eslint-disable no-use-before-define */
const Aedes = require('aedes')
const jwt = require('jsonwebtoken')
const fs = require('fs-extra')
const { Tail } = require('tail')

const logger = require('../modules/logger')
const config = require('../config/config')
const u = require('../utils/utils')
const encryption = require('../modules/security/encryption')
const ns = require('../models/nodeserver')
// const nsservice = require('./nodeservers')
// const user = require('../models/user')

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
      heartbeatInterval: 1000 // 5 seconds, Default is 60 seconds
      // connectTimeout: 3 * 10000 // Default is 30 seconds
    })

    config.aedes.on('client', async client => {
      logger.info(`MQTTS: Client Connected: ${client.id}`)
      // console.log(Object.keys(config.aedes.clients))
      config.aedes.publish({
        topic: 'udi/pg3/clients',
        payload: JSON.stringify(Object.keys(config.aedes.clients)),
        retain: true
      })
      await updateConnected(client.id, 1)
      // config.mqttClientDisconnectCallbacks[client.id] = []
    })

    config.aedes.on('clientDisconnect', async client => {
      logger.info(`MQTTS: Client Disconnected: ${client.id}`)
      await updateConnected(client.id, 0)
      // console.log(Object.keys(config.aedes.clients))
      // if (utils.isIn(config.mqttClientTails, client.id)) {
      //   config.mqttClientTails[client.id].unwatch()
      //   delete config.mqttClientTails[client.id]
      // }
      config.aedes.publish({
        topic: 'udi/pg3/clients',
        payload: JSON.stringify(Object.keys(config.aedes.clients)),
        retain: true
      })
      /*
      if (utils.isIn(config.mqttClientDisconnectCallbacks, client.id)) {
        while (config.mqttClientDisconnectCallbacks[client.id].length > 0) {
          config.mqttClientDisconnectCallbacks[client.id].shift()()
        }
        delete config.mqttClientDisconnectCallbacks[client.id]
      } */
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

    config.aedes.on('subscribe', (subs, client) => {
      subs.map(sub => {
        logger.debug(`Client ${client.id} subscribed to ${sub.topic}`)
        if (sub.topic.startsWith(`udi/pg3/frontend/clients/${config.globalsettings.id}/log/`)) {
          const subPieces = sub.topic.split('/')
          if (subPieces.length === 7) {
            streamLog(client.id, sub.topic, subPieces[6])
          }
        }
        return subs
      })
    })

    config.aedes.on('unsubscribe', (subs, client) => {
      subs.map(sub => {
        logger.debug(`Client ${client.id} unsubscribed from ${sub}`)
        if (sub.startsWith(`udi/pg3/frontend/clients/${config.globalsettings.id}/log/`)) {
          logger.debug(`Stopping log stream for ${client.id}`)
          if (config.logStreams[client.id]) {
            config.logStreams[client.id].unwatch()
            delete config.logStreams[client.id]
          }
        }
        return sub
      })
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
      // eslint-disable-next-line no-param-reassign
      client.username = username
      if (!username || !password) return callback(error, false)
      if (client.id === config.mqttClientId)
        return callback(null, password.toString() === config.mqttClientKey)
      if (username === 'debug') return callback(null, true)
      // Frontend
      if (client.id.startsWith('pg3frontend')) {
        try {
          jwt.verify(password.toString(), config.globalsettings.id)
          return callback(null, true)
        } catch (err) {
          return callback(null, false)
        }
      }
      // NodeServers
      const userParts = username.split('_')
      if (userParts.length !== 2) return callback(error, null)
      const nodeserver = await ns.get(userParts[0], userParts[1])
      if (
        nodeserver &&
        nodeserver.uuid === userParts[0] &&
        password.toString() === nodeserver.token
      )
        return callback(null, true)
      return callback(error, false)
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
        if (packet.topic.includes(`polisy/`) || packet.topic.includes(`config/`))
          return callback(null)
        return callback(error)
      }
      if (packet.topic.includes(`udi/pg3/ns/`) && !packet.topic.includes(`udi/pg3/ns/clients/`))
        return callback(null)
      return callback(error)
    }

    config.aedes.authorizeSubscribe = (client, sub, callback) => {
      const error = new Error('invalid subscription')
      try {
        if (client.id === 'debug') return callback(null, sub)
        if (client.id === config.mqttClientId) return callback(null, sub)
        if (client.id.startsWith('pg3frontend')) {
          if (sub.topic.startsWith(`udi/pg3/frontend/clients/${config.globalsettings.id}`)) {
            return callback(null, sub)
          }
          if (sub.topic.includes('sconfig') || sub.topic.includes('spolisy'))
            return callback(null, sub)
          return callback(error, null)
        }
        if (sub.topic === `udi/pg3/ns/clients/${client.id}`) return callback(null, sub)
      } catch (err) {
        logger.error(`MQTTS: authorizeSubscribe Error: ${err.stack}`)
      }
      return callback(error, null)
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

async function updateConnected(id, state) {
  try {
    if (id.includes(':') && id.includes('_')) {
      const clientParts = id.split('_')
      await Promise.allSettled(
        config.isys.map(async isy => {
          if (id.includes(isy.uuid)) {
            return ns.update(clientParts[0], clientParts[1], { connected: state })
          }
          return isy
        })
      )
    }
  } catch (err) {
    logger.error(`Couldn't update connected status for ${id} :: ${err.stack}`)
  }
}

async function streamLog(clientId, topic, type) {
  let logFile = `${process.env.PG3WORKDIR}logs/pg3-current.log`
  let uuid
  let profileNum
  // Split /log/<uuid>_<profileNum> and validate
  const typePieces = type.split('_')
  if (typePieces.length === 2) {
    ;[uuid, profileNum] = typePieces
    const nodeServer = await ns.get(uuid, profileNum)
    if (nodeServer && nodeServer.type !== 'unmanaged') {
      logFile = `${nodeServer.home}/${nodeServer.log}`
    }
  }
  if (!u.isIn(config.logStreams, clientId)) {
    try {
      logger.debug(`Starting log stream for ${clientId} :: ${logFile}`)
      config.logStreams[clientId] = new Tail(logFile)
      config.logStreams[clientId].on('line', line => {
        config.aedes.publish({
          topic,
          payload: line
        })
      })
      config.logStreams[clientId].on('error', err => {
        logger.error(`streamLog Tail error: ${err.stack}`)
        config.logStreams[clientId].unwatch()
        delete config.logStreams[clientId]
      })
    } catch (err) {
      logger.error(`streamLog for ${clientId} failed :: ${err.stack}`)
      delete config.logStreams[clientId]
    }
  }
}

// API
module.exports = { start, stop }
