/* eslint-disable no-unused-vars */
/**
 * MQTT Client Module
 * @module services/mqttc
 * @version 3.0
 */

const mqtt = require('mqtt')
const Bottleneck = require('bottleneck')

const logger = require('../modules/logger')
const config = require('../config/config')
const { addListeners } = require('../modules/mqtt/listeners')

/* This controls the global overall queue for MQTT messages
 * No matter how many requests are sent, it will conform to these limits
 * This is limited to prevent flooding and DoS attacks
 * minTime: 2ms allows for 500 requests per second 1000 ms / 2 per second
 * highWater is how many can be queue'd (1000 max)
 * strategy is the way in which the queue is emptied once highWater is hit
 * https://github.com/SGrondin/bottleneck#strategies
 */
const GLOBALQUEUE = {
  minTime: 2,
  highWater: 1000,
  strategy: Bottleneck.strategy.OVERFLOW
}

// Enables listeners for easy debugging
function startQueueEvents(queue) {
  queue.on('error', error => {
    // logger.error(error.stack)
  })
  queue.on('failed', (error, jobInfo) => {
    // logger.error(error.stack, `${JSON.stringify(jobInfo)}`)
  })
  queue.on('dropped', dropped => {
    // logger.debug(`Dropped: ${JSON.stringify(dropped)}`)
  })
  queue.on('debug', (message, data) => {
    // logger.debug(`Debug: ${message} :: ${JSON.stringify(data)}`)
  })
  queue.on('done', info => {
    // logger.debug(`Job Info: ${JSON.stringify(info)}`)
  })
}

function addSubscriptions() {
  const subscriptions = [
    'udi/pg3/ns/status/#',
    'udi/pg3/ns/command/#',
    'udi/pg3/ns/system/#',
    'udi/pg3/ns/custom/#',
    'udi/pg3/frontend/command/#',
    'udi/pg3/frontend/system/#',
    'udi/pg3/frontend/settings/#'
  ]
  config.mqttClient.subscribe(subscriptions, (err, granted) => {
    granted.map(grant => logger.debug(`MQTTC: Subscribed to ${grant.topic} QoS ${grant.qos}`))
  })
  config.mqttClient.publish(
    'udi/pg3/connections',
    JSON.stringify({ clientId: config.mqttClientId, connected: true })
  )
}

/**
 * MQTT Start Service and Connect via .env MQTT_HOST and MQTT_PORT provided.
 * @method
 * @param {function} callback - Callback when connected or if already started.
 */
function start() {
  if (!config.mqttClient) {
    config.queue.mqtt = new Bottleneck(GLOBALQUEUE)
    startQueueEvents(config.queue.mqtt)
    const options = {
      keepalive: 10,
      clean: true,
      clientId: config.mqttClientId,
      reconnectPeriod: 5000,
      connectTimeout: 30 * 1000,
      username: 'pg3',
      password: config.mqttClientKey
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
    const mqttConnectString = `${
      config.globalsettings.secure ? 'mqtts://' : 'mqtt://'
    }${host}:${port}`
    config.mqttClient = mqtt.connect(mqttConnectString, options)

    config.mqttClient.on('connect', () => {
      addSubscriptions()
    })

    addListeners()

    logger.info('Started MQTT Client Service')
  }
}

/**
 * MQTT Stop Service
 * @method
 * @param {function} callback - Callback when service is and conneciton is clear.
 */
async function stop() {
  if (config.mqttClient) {
    await config.mqttClient.publish(
      'udi/pg3/connections',
      JSON.stringify({ clientId: config.mqttClientId, connected: true })
    )
    logger.info('MQTT Client Services Stopping Gracefully.')
    config.mqttClient.end(true, () => {
      config.mqttClient = null
    })
  }
}

// API
module.exports = {
  start,
  stop
}
