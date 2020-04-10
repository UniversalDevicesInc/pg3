const config = require('../../config/config')
const logger = require('../logger')

const PRIORITY = {
  system: 7,
  command: 6,
  status: 5
}

function randomQueue(max) {
  return Math.floor(Math.random() * (max - 1 + 1) + 1)
}

// Test ISY
async function testQueues() {
  const timer = process.hrtime()
  const isy = Object.values(config.isys)[0]
  if (isy) {
    const url = `${isy.secure === 1 ? 'https://' : 'http://'}${isy.ip}:${isy.port}/desc`
    const count = 1000
    const allThePromises = []
    for (let i = 0; i < count; i += 1) {
      allThePromises.push(
        config.queue[isy.uuid].system.schedule({ id: `system${i}`, priority: PRIORITY.system }, () =>
          config.httpClient[isy.uuid].get(`${url}+system${i}`, { isy })
        )
      )
      allThePromises.push(
        config.queue[isy.uuid].commandGroup
          .key(randomQueue(10))
          .schedule({ id: `command${i}`, priority: PRIORITY.command }, () =>
            config.httpClient[isy.uuid].get(`${url}+command${i}`, { isy })
          )
      )
      allThePromises.push(
        config.queue[isy.uuid].statusGroup
          .key(randomQueue(10))
          .schedule({ id: `status${i}`, priority: PRIORITY.status }, () =>
            config.httpClient[isy.uuid].get(`${url}+status${i}`, { isy })
          )
      )
    }
    try {
      const results = await Promise.allSettled(allThePromises)
      const end = process.hrtime(timer)
      const duration = (end[0] * 1e9 + end[1]) / 1e9
      let completed = 0
      let failed = 0
      let total = 0
      results.map(result => {
        if (result.status === 'fulfilled') completed += 1
        if (result.status === 'rejected') {
          failed += 1
          logger.error(`Test Error: ${result.reason}`)
        }
        total += 1
        return result
      })
      logger.warn(`Test took ${duration}s. ${failed} failed and ${completed} succeded out of ${total}`)
    } catch (err) {
      logger.error(err.stack)
    }
  }
}

module.exports = { testQueues }
