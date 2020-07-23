/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign,
  array-callback-return,
  no-unused-vars
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

async function reboot(id, cmd, data) {
  const { uuid } = data
  try {
    return await isySystem.reboot(uuid)
  } catch (err) {
    logger.error(`reboot: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}

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

async function getSettings(id, cmd, data) {
  try {
    return settings.get()
  } catch (err) {
    logger.error(`getSettings: ${err.stack}`)
  }
  return { success: false, error: 'failed to get settings' }
}

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
