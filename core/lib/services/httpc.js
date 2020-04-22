/* eslint-disable no-unused-vars */
/**
 * HTTP Client Module for REST calls to the ISY Interfaces
 * Generates core httpAgents and queues
 * @module services/httpc
 * @version 3.0
 */

const http = require('http')
const https = require('https')
const axios = require('axios')
const Bottleneck = require('bottleneck')

const { httpAgentOptions, MAX_RETRIES } = require('../config/http')
const config = require('../config/config')
const logger = require('../modules/logger')

/* This controls the global overall queue for the ISY
 * No matter how many requests are sent, it will conform to these limits
 * maxConcurrent: 2 (httpAgent has a max open sockets of 2)
 * This is limited by the ISY after extensive testing in PG2
 * minTime: 10ms allows for 100 requests per second 1000 ms / 10 per second
 */
const GLOBALQUEUE = {
  maxConcurrent: httpAgentOptions.maxSockets,
  minTime: 10,
  highWater: 1000,
  strategy: Bottleneck.strategy.OVERFLOW_PRIORITY
}

// minTime: 40ms allows for 25 requests per second max
const COMMANDQUEUE = {
  minTime: 40
}

// minTime: 40ms allows for 50 requests per second max
const STATUSQUEUE = {
  minTime: 20
}

// minTime: 200 allows for 5 requests per second per nodeserver
const COMMANDGROUP = {
  minTime: 200
}

// minTime: 100 allows for 10 requests per second per nodeserver
const STATUSGROUP = {
  minTime: 100
}

// Axios http config. See: https://github.com/axios/axios/blob/master/README.md#request-config
const HTTPCONFIG = {
  timeout: 5000,
  responseType: 'text',
  httpAgent: new http.Agent(httpAgentOptions),
  httpsAgent: new https.Agent(httpAgentOptions),
  decompress: true
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

async function createQueues(isy) {
  logger.info(`Creating ISY queues for ${isy.uuid}`)
  config.queue[isy.uuid] = {}
  config.queue[isy.uuid].global = new Bottleneck(GLOBALQUEUE)
  startQueueEvents(config.queue[isy.uuid].global)
  // Don't set specific limits on system it will conform to global
  config.queue[isy.uuid].system = new Bottleneck().chain(config.queue[isy.uuid].global)
  startQueueEvents(config.queue[isy.uuid].system)
  // Limit for all nodeserver 'command'
  config.queue[isy.uuid].command = new Bottleneck(COMMANDQUEUE).chain(config.queue[isy.uuid].global)
  startQueueEvents(config.queue[isy.uuid].command)
  // Limit for all nodeserver 'status'
  config.queue[isy.uuid].status = new Bottleneck(STATUSQUEUE).chain(config.queue[isy.uuid].global)
  startQueueEvents(config.queue[isy.uuid].status)
  config.queue[isy.uuid].commandGroup = new Bottleneck.Group(COMMANDGROUP)
  config.queue[isy.uuid].commandGroup.on('created', (queue, key) => {
    logger.debug(`Created Command Queue for for Nodeserver ${key}`)
    queue.chain(config.queue.command)
    startQueueEvents(queue)
  })
  config.queue[isy.uuid].statusGroup = new Bottleneck.Group(STATUSGROUP)
  config.queue[isy.uuid].statusGroup.on('created', (queue, key) => {
    logger.debug(`Created Status Queue for Nodeserver ${key}`)
    queue.chain(config.queue[isy.uuid].status)
    startQueueEvents(queue)
  })
}

async function removeQueues(isy) {
  logger.info(`Removing ISY queues for ${isy.uuid}`)
  await Promise.allSettled([
    Promise.allSettled(
      config.queue[isy.uuid].statusGroup
        .keys()
        .map(key => config.queue[isy.uuid].statusGroup.deleteKey(key))
    ),
    Promise.allSettled(
      config.queue[isy.uuid].commandGroup
        .keys()
        .map(key => config.queue[isy.uuid].commandGroup.limiter.deleteKey(key))
    ),
    config.queue[isy.uuid].status.stop(),
    config.queue[isy.uuid].command.stop(),
    config.queue[isy.uuid].system.stop(),
    config.queue[isy.uuid].global.stop()
  ])
}

async function createClient(isy) {
  config.httpClient[isy.uuid] = axios.create(HTTPCONFIG)
  config.httpClient[isy.uuid].interceptors.request.use(
    request => {
      if (request.isy) {
        /* eslint no-param-reassign: "error" */
        request.auth = {
          username: request.isy.username,
          password: request.isy.password
        }
      }
      request.startTime = process.hrtime()
      if (!request.retryCount) request.retryCount = 1
      return request
    },
    error => Promise.reject(error)
  )
  config.httpClient[isy.uuid].interceptors.response.use(
    response => {
      const end = process.hrtime(response.config.startTime)
      const duration = (end[0] * 1e9 + end[1]) / 1e6
      logger.debug(
        `ISY Response: [Try: ${response.config.retryCount}] [${response.config.isy.uuid}] :: [${response.status}] :: ${duration}ms - ${response.config.url}`
      )
      return new Promise(resolve => resolve(response))
    },
    error => {
      if (!error.config.retry) return Promise.resolve(error.response)
      const end = process.hrtime(error.config.startTime)
      const duration = (end[0] * 1e9 + end[1]) / 1e6
      const status = error.response
        ? `${error.response.status} - ${error.response.statusText}`
        : `${error.code}`
      let { retryCount } = error.config
      if (error.config.retryCount <= MAX_RETRIES) {
        retryCount += 1
        logger.warn(
          `ISY Response: [Try: ${error.config.retryCount}] [${error.config.isy.uuid}] :: [${status}] :: ${duration}ms - ${error.config.url}`
        )
        error.config.startTime = process.hrtime()
        error.config.retryCount = retryCount
        return config.httpClient[isy.uuid](error.config)
      }
      logger.error(
        `ISY Response: [MAX TRIES EXCEEDED] [${error.config.isy.uuid}] :: [${status}] :: ${duration}ms - ${error.config.url}`
      )
      return Promise.reject(error)
    }
  )
}

async function start() {
  const startingPromises = []
  Object.values(config.isys).map(isy => startingPromises.push(createQueues(isy), createClient(isy)))
  await Promise.all(startingPromises)

  // This runs the load test in ./testqueues
  // const { testQueues } = require('../modules/isy/testqueues')
  // await testQueues()
  // const { reboot } = require('../modules/isy/system')
  // await reboot('00:21:b9:02:45:1b')
}

async function stop() {
  await Promise.allSettled(Object.values(config.isys).map(isy => removeQueues(isy)))
}

module.exports = { start, stop }
