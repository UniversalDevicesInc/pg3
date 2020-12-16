/* eslint-disable
  no-use-before-define,
  no-empty
  */
/**
 * Nodeserver Drivers
 * @module mqtt/custom
 * @version 3.0
 */
const logger = require('../logger')
const u = require('../../utils/utils')

const custom = require('../../models/custom')
const nscore = require('./core')

const KEYS = [
  'customparams',
  'customdata',
  'customparamsdoc',
  'customtypeddata',
  'customtypedparams',
  'notices'
]
/**
 * @route {SET} udi/pg3/ns/custom/{uuid}
 * @param {string} uuid The UUID of the ISY
 * @param {Object} data Request body
 * @param {Object[]} data.set - Perform SET action
 * @param {string} data.set.key
 * @param {string} data.set.value
 * @example <caption>Request</caption>
{
  "set": [{
    "key": "customparams",
    "value": "{abc: def}"
  }]
}
 * @example <caption>Response</caption>
{
  "set": [
    {
      "success": true,
      "key": "customparams"
    }
  ]
}
 */
async function set([uuid, profileNum], cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  if (data.length <= 0) throw new Error(`${cmd} has no entries.`)
  return Promise.all(
    Object.values(data).map(async item => {
      try {
        if (typeof item !== 'object') throw new Error(`custom object invalid`)
        if (!u.hasProps(item, API[cmd].props))
          throw new Error(
            `${cmd} object does not have the correct properties :: ${JSON.stringify(item)}`
          )
        // Uncommenting the below line would only allow saving of system keys
        // if (!KEYS.includes(item.key)) throw new Error(`${item.key} is not a setable key`)
        const value = typeof item.value === 'object' ? JSON.stringify(item.value) : item.value
        await custom.add(uuid, profileNum, item.key, value)
        logger.info(`[${uuid}_${profileNum}] Set ${item.key}`)
        nscore.sendMessage(uuid, profileNum, { [item.key] : value })
        return { success: true, key: item.key }
      } catch (err) {
        logger.error(`command ${cmd} ${err.message}`)
        return { success: false, key: item.key, error: err.message }
      }
    })
  )
}
/**
 * @route {GET} udi/pg3/ns/custom/{uuid}
 * @param {string} uuid The UUID of the ISY
 * @param {Object} data Request body
 * @param {Object[]} data.get - Perform SET action
 * @param {string} data.get.key
 * @example <caption>Request</caption>
{
  "get": [{"key": "customdata"}, {"key": "customparams"}]
}
 * @example <caption>Response</caption>
{
  "get": [
    {
      "id": "aee2c611-89f2-4540-81e7-114eef974779",
      "uuid": "00:21:b9:02:45:1b",
      "profileNum": 2,
      "key": "customdata",
      "value": "{\"profile_version\":\"2.1.0\"}",
      "dbVersion": 1
    },
    {
      "id": "df613de1-3957-4257-b6c3-4ca2e001ef6f",
      "uuid": "00:21:b9:02:45:1b",
      "profileNum": 2,
      "key": "customparams",
      "value": "{\"password\":\"YourPassword\",\"user\":\"YourUserName\",\"some_example\":\"{ \\\"type\\\": \\\"TheType\\\", \\\"host\\\": \\\"host_or_IP\\\", \\\"port\\\": \\\"port_number\\\" }\"}",
      "dbVersion": 1
    }
  ]
}
 */
async function get([uuid, profileNum], cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  if (data.length <= 0) throw new Error(`${cmd} has no entries.`)
  const results = []
  await Promise.allSettled(
    Object.values(data).map(async item => {
      try {
        if (typeof item !== 'object') throw new Error(`custom object invalid`)
        if (!u.hasProps(item, API[cmd].props))
          throw new Error(`${cmd} object does not have the correct properties`)
        if (!KEYS.includes(item.key)) throw new Error(`${item.key} is not a valid property`)
        const value = await custom.get(uuid, profileNum, item.key)
        if (value) {
          logger.info(`[${uuid}_${profileNum}] Retrieved ${item.key}`)
          try {
            value[item.key] = JSON.parse(value[item.key])
          } catch (err) {
            results.push(value)
          }
        }
      } catch (err) {
        logger.error(`command ${cmd} ${err.message}`)
        results.push({ key: [item.key], error: err.message })
      }
    })
  )
  return results
}

async function getAll([uuid, profileNum], cmd, data) {
  return custom.getAll(uuid, profileNum)
}

const API = {
  set: {
    props: ['key', 'value'],
    func: set
  },
  get: {
    props: ['key'],
    func: get
  },
  getAll: {
    props: [],
    func: getAll
  }
}

module.exports = { API, get, set }
