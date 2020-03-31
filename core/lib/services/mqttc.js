const mqtt = require('mqtt')

const logger = require('../modules/logger')
const config = require('../config/config')
const utils = require('../utils/utils')

/**
 * MQTT Client Module
 * @module services/mqttc
 * @version 3.0
 */

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

function addSubscriptions() {
  const subscriptions = [
    'udi/polyglot/connections/#',
    'udi/polyglot/frontend/#',
    'udi/polyglot/frontend/settings',
    'udi/polyglot/frontend/nodeservers',
    'udi/polyglot/frontend/log',
    'udi/polyglot/ns/#',
    'udi/polyglot/profile/#'
  ]
  config.mqttClient.subscribe(subscriptions, (err, granted) => {
    granted.forEach(grant => {
      logger.debug(`MQTTC: Subscribed to ${grant.topic} QoS ${grant.qos}`)
    })
  })
  config.mqttClient.publish(
    'udi/polyglot/connections/polyglot',
    JSON.stringify({ node: config.mqttClientId, connected: true }),
    { retain: true }
  )
}

function addSubscription(profileNum) {
  // TODO: remove this after a release or two
  config.mqttClient.publish('udi/polyglot/connections/frontend', null, { retain: true })
  const subscriptions = [`udi/polyglot/ns/${profileNum}`, `udi/polyglot/profile/${profileNum}`]
  config.mqttClient.subscribe(subscriptions, (err, granted) => {
    granted.forEach(grant => {
      logger.debug(`MQTTC: Subscribed to ${grant.topic} QoS ${grant.qos}`)
    })
  })
}

function delSubscription(profileNum) {
  config.mqttClient.publish(`udi/polyglot/connections/${profileNum}`, null, { retain: true })
  config.mqttClient.publish(`udi/polyglot/ns/${profileNum}`, null, { retain: true })
  // let subscriptions = [`udi/polyglot/ns/${profileNum}`, `udi/polyglot/profile/'${profileNum}`]
  // config.mqttClient.unsubscribe(subscriptions, (err) => {})
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
  if (utils.hasOwn(message, 'seq')) {
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

/**
 * MQTT Start Service and Connect via .env MQTT_HOST and MQTT_PORT provided.
 * @method
 * @param {function} callback - Callback when connected or if already started.
 */
function start() {
  if (!config.mqttClient) {
    const options = {
      keepalive: 0,
      clean: true,
      clientId: config.mqttClientId,
      reconnectPeriod: 5000,
      connectTimeout: 30 * 1000
      // will: { retain: true },
    }
    const host = config.globalsettings.mqttHost || '127.0.0.1'
    const port = config.globalsettings.mqttPort || 1883
    if (config.globalsettings.secure) {
      options.key = config.sslData.clientprivate
      options.cert = config.sslData.clientcert
      options.ca = config.sslData.cert
      options.rejectUnauthorized = true
    }
    // options['will']['topic'] = 'udi/polyglot/connections/polyglot'
    // options['will']['payload'] = new Buffer(JSON.stringify({node: config.mqttClientId, 'connected': false}))
    const mqttConnectString = `${config.globalsettings.secure ? 'mqtts://' : 'mqtt://'}${host}:${port}`
    config.mqttClient = mqtt.connect(mqttConnectString, options)

    config.mqttClient.on('connect', () => {
      config.mqttConnected = true
      addSubscriptions()
    })

    config.mqttClient.on('message', (topic, payload) => {
      // logger.debug(packet.toString())
      if (payload == null || payload === '') return
      let topicObject = {}
      let parsed
      try {
        parsed = JSON.parse(payload.toString())
        if (!parsed.node || parsed.node === 'polyglot') return
        const temp = topic.replace(/^udi\/polyglot\//i, '').split('/')
        topicObject = {
          base: temp[0],
          subject: temp[1]
        }
      } catch (e) {
        logger.error(`MQTTC: Badly formatted JSON input received: ${payload} - ${e}`)
        return
      }
      logger.debug(JSON.stringify(topicObject))
      // parse.parse(topicObject, parsed)
    })

    config.mqttClient.on('reconnect', () => {
      config.mqttConnected = false
      logger.info('MQTT attempting reconnection to broker...')
    })

    config.mqttClient.on('error', err => {
      logger.error(`MQTT received error: ${err.toString()}`)
    })

    logger.info('MQTT Client Service: Started')
  }
}

/**
 * MQTT Stop Service
 * @method
 * @param {function} callback - Callback when service is and conneciton is clear.
 */
async function stop() {
  if (config.mqttClient) {
    publish('udi/polyglot/connections/polyglot', { node: config.mqttClientId, connected: false }, { retain: true })
    logger.info('MQTT Client Services Stopping Gracefully.')
    config.mqttClient.end(true, () => {
      config.mqttClient = null
    })
  }
}

// API
module.exports = { start, stop, addSubscriptions, addSubscription, delSubscription, makeResponse, nsResponse }
