/**
 * Global httpAgent Configuration options
 * @module config/http
 * @version 3.0
 */

const httpAgentOptions = {
  keepAlive: true,
  // keepAliveMsecs: 300,
  maxSockets: 2
  // maxFreeSockets: 2
}

const MAX_RETRIES = 3

module.exports = { httpAgentOptions, MAX_RETRIES }
