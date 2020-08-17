/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign,
  array-callback-return,
  no-unused-vars
  */
 /**
 * Nodeserver Drivers
 * @module mqtt/frontend/system
 * @version 3.0
 */
const config = require('../../config/config')
const u = require('../../utils/utils')
const logger = require('../logger')
const isy = require('../../models/isy')
const ns = require('../../services/nodeservers')
const settings = require('../../models/globalsettings')
const isySystem = require('../isy/system')
const isyDiscover = require('../isy/discover')
const encryption = require('../security/encryption')

/**
 * @route {reboot} udi/pg3/frontend/system/admin
 * @param {Object} data Request body
 * @param {Object} data.reboot
 * @param {string} data.reboot.uuid
 * @example <caption>Request</caption>
{
  "reboot": {
    "uuid": "00:21:b9:02:45:1b"
  }
}
 * @example <caption>Response</caption>
{
  "reboot": {
    "message": "Reboot command sent to ISY successfully.",
    "success": true,
    "extra": {}
  }
}
 */
async function reboot(id, cmd, data) {
  const { uuid } = data
  try {
    return await isySystem.reboot(uuid)
  } catch (err) {
    logger.error(`reboot: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}
/**
 * @route {getIsys} udi/pg3/frontend/system/admin
 * @param {Object} data Request body
 * @param {Object} data.getIsys
 * @example <caption>Request</caption>
{
  "getIsys": {}
}
 * @example <caption>Response</caption>
{
  "getIsys": [
    {
      "id": "d5f91e3b-1e41-4df4-be54-66fe80528817",
      "uuid": "00:21:b9:02:45:1b",
      "name": "ISY",
      "ip": "10.0.0.210",
      "port": 80,
      "username": "admin",
      "enabled": 1,
      "discovered": 1,
      "version": "5.0.16B",
      "secure": 0,
      "timeAdded": 1586726557562,
      "timeModified": 1586726557562,
      "dbVersion": 1
    }
  ]
}
 */
async function getIsys(id, cmd, data) {
  try {
    const results = await isy.getAll()
    results.map(item => {
      delete item.password
      return item
    })
    return results
  } catch (err) {
    logger.error(`getAllNs: ${err.stack}`)
    return { success: false, error: `${err.message}` }
  }
}
/**
 * @route {getSettings} udi/pg3/frontend/system/admin
 * @param {Object} data Request body
 * @param {Object} data.getSettings
 * @example <caption>Request</caption>
{
  "getSettings": {}
}
 * @example <caption>Response</caption>
{
  "getSettings": {
    "id": "9451ba9d-5d6e-490f-a1dc-bbdcbddee109",
    "name": "pg3",
    "pg3Version": "3.0.0",
    "mqttHost": "localhost",
    "mqttPort": 1883,
    "ipAddress": "10.0.0.137",
    "bindIpAddress": "0.0.0.0",
    "listenPort": 3000,
    "secure": 1,
    "customCerts": 0,
    "beta": 0,
    "timeStarted": 1594849485434,
    "secret": null,
    "polisy": 0,
    "timeAdded": 1586726557470,
    "timeModified": 1594849485434,
    "dbVersion": 1
  }
}
 */
async function getSettings(id, cmd, data) {
  try {
    return settings.get()
  } catch (err) {
    logger.error(`getSettings: ${err.stack}`)
  }
  return { success: false, error: 'failed to get settings' }
}

/**
 * @route {setSettings} udi/pg3/frontend/system/admin
 * @param {Object} data Request body
 * @param {Object} data.setSettings
 * @example <caption>Request</caption>
{
  "id": 13423,
  "setSettings": {
    "beta": 0
  }
}
 * @example <caption>Response</caption>
{
  "setSettings": {
    "id": "9451ba9d-5d6e-490f-a1dc-bbdcbddee109",
    "name": "pg3",
    "pg3Version": "3.0.0",
    "mqttHost": "localhost",
    "mqttPort": 1883,
    "ipAddress": "10.0.0.137",
    "bindIpAddress": "0.0.0.0",
    "listenPort": 3000,
    "secure": 1,
    "customCerts": 0,
    "beta": 1,
    "timeStarted": 1594849485434,
    "secret": null,
    "polisy": 0,
    "timeAdded": 1586726557470,
    "timeModified": 1594849968857,
    "dbVersion": 1
  }
}
 */
async function setSettings(id, cmd, data) {
  try {
    const updateObject = {}
    const keys = Object.keys(config.globalsettings)
    keys.map(key => {
      if (!u.isIn(data, key)) return
      if (config.globalsettings[key] !== data[key]) updateObject[key] = data[key]
    })
    if (Object.keys(updateObject).length > 0) await settings.update(updateObject)
    config.globalsettings = await settings.get()
    return config.globalsettings
  } catch (err) {
    logger.error(`setSettings: ${err.stack}`)
  }
  return { success: false, error: 'Nothing updated' }
}
/**
 * @route {discoverIsys} udi/pg3/frontend/system/admin
 * @param {Object} data Request body
 * @param {Object} data.discoverIsys
 * @example <caption>Request</caption>
{
  "discoverIsys": {}
}
 */
async function discoverIsys(id, cmd, data) {
  try {
    logger.info(`Attempting ISY Auto-Discovery...`)
    const discoveredIsy = await isyDiscover.find()
    const result = { success: true }
    if (discoveredIsy.discovered === 1) {
      const exists = config.isys.filter(it => it.uuid === discoveredIsy.uuid)
      if (exists.length <= 0) {
        // const newEntry = new isy.DEFAULTS()
        // newEntry.password = encryption.encryptText(newEntry.password)
        // Object.assign(newEntry, discoveredIsy)
        await isy.add(discoveredIsy)
        config.isys = await isy.getAll()
        logger.info(
          `Discovered ISY Version ${discoveredIsy.version} with ID: ${discoveredIsy.uuid} at ${discoveredIsy.ip}:${discoveredIsy.port} successfully.`
        )
        Object.assign(result, discoveredIsy)
        await ns.verifyNodeServers()
      } else {
        throw new Error(`No new ISY discovered.`)
      }
    } else throw new Error(`No ISY Discovered`)
    return result
  } catch (err) {
    logger.error(`discoverIsys: ${err.stack}`)
    return { success: false, error: `${err.message}` }
  }
}
/**
 * @route {addIsy} udi/pg3/frontend/system/admin
 * @param {Object} data Request body
 * @param {Object} data.addIsy
 * @param {string} data.addIsy.ip
 * @param {number} data.addIsy.port
 * @param {string} data.addIsy.username
 * @param {string} data.addIsy.password
 * @param {number} data.addIsy.secure
 * @example <caption>Request</caption>
{
  "addIsy": {
    "name": "prod",
    "ip": "10.0.0.14",
    "port": 80,
    "username": "admin",
    "password": "password",
    "secure": 0
  }
}
 */
async function addIsy(id, cmd, data) {
  try {
    const { ip, port, username, password, secure } = data
    const result = await isySystem.getUuid(data)
    if (result.success) {
      await isy.add({ uuid: result.uuid, version: result.version, ...data })
      await ns.verifyNodeServers()
    }
    return result
  } catch (err) {
    logger.error(`updateIsy: ${err.stack}`)
    return { success: false, error: `${err.message}` }
  }
}
/**
 * @route {updateIsy} udi/pg3/frontend/system/admin
 * @param {Object} data Request body
 * @param {Object} data.updateIsy
 * @param {string} data.updateIsy.uuid
 * @example <caption>Request</caption>
{
  "updateIsy": {
    "uuid": "00:21:b9:02:45:1b",
    "name": "dev"
  }
}
 * @example <caption>Response</caption>
 {
  "updateIsy": {
    "uuid": "00:21:b9:02:45:1b",
    "success": true
  }
}
 */
async function updateIsy(id, cmd, data) {
  try {
    const { uuid } = data
    const result = { uuid, success: true }
    await isy.update(uuid, data)
    if (u.isIn(data, 'password') || u.isIn(data, 'username')) await ns.verifyNodeServers()
    return result
  } catch (err) {
    logger.error(`updateIsy: ${err.stack}`)
    return { success: false, error: `${err.message}` }
  }
}

async function removeIsy(id, cmd, data) {
  try {
    const { uuid } = data
    const result = { uuid, success: true }
    await ns.removeAllNs(uuid)
    await isy.remove(uuid)
    await ns.verifyNodeServers()
    return result
  } catch (err) {
    logger.error(`updateIsy: ${err.stack}`)
    return { success: false, error: `${err.message}` }
  }
}

const API = {
  discoverIsys: {
    props: [],
    func: discoverIsys
  },
  reboot: {
    props: ['uuid', 'name', 'profileNum', 'url'],
    func: reboot
  },
  getIsys: {
    props: [],
    func: getIsys
  },
  getSettings: {
    props: [],
    func: getSettings
  },
  setSettings: {
    props: [],
    func: setSettings
  },
  addIsy: {
    props: ['ip', 'port', 'username', 'password', 'secure'],
    func: addIsy
  },
  updateIsy: {
    props: ['uuid'],
    func: updateIsy
  },
  removeIsy: {
    props: ['uuid'],
    func: removeIsy
  }
}

module.exports = { API }
