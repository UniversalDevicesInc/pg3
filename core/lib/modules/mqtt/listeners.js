const logger = require('../logger')
const config = require('../../config/config')

const { processMessage } = require('./inbound')

function addListeners() {
  config.mqttClient.on('message', (topic, payload) => {
    if (!payload) return
    try {
      const parsed = JSON.parse(payload.toString())
      config.queue.mqtt.schedule(() => {
        processMessage(topic, parsed)
      })
    } catch (e) {
      logger.error(`MQTTC: Badly formatted JSON input received: ${payload} - ${e}`)
    }
  })

  config.mqttClient.on('reconnect', () => {
    logger.info('MQTT attempting reconnection to broker...')
  })

  config.mqttClient.on('error', err => {
    logger.error(`MQTT received error: ${err.toString()}`)
  })
}

module.exports = {
  addListeners
}
