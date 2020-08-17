/* eslint-disable
  no-use-before-define,
  no-underscore-dangle
  */
/**
 * Nodeserver Drivers
 * @module mqtt/ns
 * @version 3.0
 */
const convert = require('xml2js')

// const config = require('../../config/config')
const logger = require('../logger')
const u = require('../../utils/utils')

const isy = require('../isy/core')
const driver = require('../../models/driver')

const API = {
  get: {
    props: ['address'],
    func: get
  },
  set: {
    props: ['address', 'driver', 'value', 'uom'],
    func: set
  }
}

async function get([uuid, profileNum], cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  if (data.length <= 0) throw new Error(`${cmd} has no entries.`)
  return Promise.all(Object.values(data).map(item => getDrivers(uuid, profileNum, item)))
}

async function set([uuid, profileNum], cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  if (data.length <= 0) throw new Error(`${cmd} has no entries.`)
  return Promise.all(Object.values(data).map(item => setDriver(uuid, profileNum, item)))
}

/**
 * @route {GET} udi/pg3/ns/status/{uuid}
 * @param {string} uuid The UUID of the ISY
 * @param {number} profileNum
 * @param {Object} data Request body
 * @param {Object[]} data.get - Perform GET action
 * @param {string} data.get.address
 * @example <caption>Request</caption>
  {
  "get": [{
    "address": "controller",
   }]
  }
 * @example <caption>Response</caption>
  {
  "get": [
    {
      "address": "controller",
      "drivers": [
        {
          "driver": "GV1",
          "value": "293",
          "uom": "19"
        },
        {
          "driver": "ST",
          "value": "43",
          "uom": "12"
        }
      ]
    }
  ]
}
 */
async function getDrivers(uuid, profileNum, data) {
  let response = {}
  try {
    if (typeof data !== 'object') throw new Error(`driver object invalid`)
    if (!u.hasProps(data, API.get.props))
      throw new Error(`driver object does not have the correct properties`)
    const path = ['rest', 'nodes', isy.addNodePrefix(profileNum, data.address)]
    response = await isy.isyGet(uuid, 'status', isy.makeSystemUrl(uuid, path), profileNum)
    if (response.status !== 200) throw new Error(`node '${data.address}' not found`)
    const result = { address: data.address, drivers: [] }
    const opts = {
      trim: true,
      async: true,
      mergeAttrs: true,
      explicitArray: false
    }
    const parsed = await convert.parseStringPromise(response.data, opts)
    if (Array.isArray(parsed.nodeInfo.properties.property)) {
      parsed.nodeInfo.properties.property.forEach(item => {
        result.drivers.push({
          driver: `${item.id}`,
          value: item.value,
          uom: item.uom
        })
      })
    } else if (Object.keys(parsed.nodeInfo.properties).length > 0) {
      result.drivers[parsed.nodeInfo.properties.property.id] = {
        value: parsed.nodeInfo.properties.property.value,
        uom: parsed.nodeInfo.properties.property.uom
      }
    }
    return result
  } catch (err) {
    logger.error(`[${uuid}_${profileNum}] status get :: ${err.stack}`)
    return {
      address: data.address,
      error: err.message,
      ...(response.status ? { code: response.status } : {})
    }
  }
}

/**
 * @route {SET} udi/pg3/ns/status/{uuid}
 * @param {string} uuid The UUID of the ISY
 * @param {number} profileNum
 * @param {Object} data Request body
 * @param {Object[]} data.set - Perform SET action
 * @param {string} data.set.address
 * @param {string} data.set.driver
 * @param {string} data.set.value
 * @param {number} data.set.uom 
 * @param {boolean} [isNew=false]
 * @example <caption>Request</caption>
{
  "set": [{
    "address": "controller",
    "driver": "ST",
    "value": "42",
    "uom": 12
  }]
}
 * @example <caption>Response</caption>
{
  "set": [{
    "address": "controller",
    "driver": "ST",
    "value": "42",
    "uom": 12
  }]
}
 */
async function setDriver(uuid, profileNum, data, isNew = false) {
  let response = {}
  try {
    if (typeof data !== 'object') throw new Error(`driver object invalid`)
    if (!u.hasProps(data, API.set.props))
      throw new Error(`driver object does not have the correct properties`)
    const path = [
      'nodes',
      isy.addNodePrefix(profileNum, data.address),
      'report',
      'status',
      data.driver,
      data.value,
      data.uom
    ]
    response = await isy.isyGet(uuid, 'status', isy.makeNodeUrl(uuid, profileNum, path), profileNum)
    if (response.status !== 200) throw new Error(`could not set driver on ISY ${response.status}`)
    if (!isNew) {
      driver.update(uuid, profileNum, data.address, data.driver, {
        value: data.value,
        uom: data.uom
      })
    }
    return data
  } catch (err) {
    logger.error(`[${uuid}_${profileNum}] status set :: ${err.stack}`)
    return {
      address: data.address,
      driver: data.driver,
      error: err.message,
      ...(response.status ? { code: response.status } : {})
    }
  }
}

module.exports = { API, getDrivers, setDriver }
