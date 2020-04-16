/* eslint-disable
  no-use-before-define,
  no-underscore-dangle
  */
const convert = require('xml-js')

const config = require('../../config/config')
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

async function get(uuid, profileNum, cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  return Promise.all(Object.values(data).map(item => getDrivers(uuid, profileNum, item)))
}

async function set(uuid, profileNum, cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  return Promise.all(Object.values(data).map(item => setDriver(uuid, profileNum, item)))
}

async function getDrivers(uuid, profileNum, data) {
  let response = {}
  try {
    if (typeof data !== 'object') throw new Error(`driver object invalid`)
    if (!u.hasProps(data, API.get.props))
      throw new Error(`driver object does not have the correct properties`)
    const path = ['rest', 'nodes', isy.addNodePrefix(profileNum, data.address)]
    response = await isy.isyGet(uuid, 'status', isy.makeSystemUrl(uuid, path))
    if (response.status !== 200) throw new Error(`could not get status from ISY`)
    const result = { address: data.address, drivers: {} }
    const parsed = convert.xml2js(response.data, { compact: true })
    if (Array.isArray(parsed.nodeInfo.properties)) {
      parsed.nodeInfo.properties.map(item => {
        result.drivers[item._attributes.id] = {
          value: item._attributes.value,
          uom: item._attributes.uom
        }
        return true
      })
    } else if (Object.keys(parsed.nodeInfo.properties).length > 0) {
      result.drivers[parsed.nodeInfo.properties.property._attributes.id] = {
        value: parsed.nodeInfo.properties.property._attributes.value,
        uom: parsed.nodeInfo.properties.property._attributes.uom
      }
    }
    return result
  } catch (err) {
    logger.error(`status get :: ${err}`)
    return {
      address: data.address,
      error: err.message,
      ...(response.status ? { code: response.status } : {})
    }
  }
}

async function setDriver(uuid, profileNum, data) {
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
    driver.update(uuid, profileNum, data.address, data.driver, {
      value: data.value,
      uom: data.uom
    })
    return data
  } catch (err) {
    logger.error(`status set ${err.stack}`)
    return {
      address: data.address,
      driver: data.driver,
      error: err.message,
      ...(response.status ? { code: response.status } : {})
    }
  }
}

module.exports = { API, getDrivers, setDriver }
