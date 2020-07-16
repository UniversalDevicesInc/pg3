/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign
  */

const config = require('../../config/config')
const u = require('../../utils/utils')
const logger = require('../logger')
const isy = require('../../models/isy')
const settings = require('../../models/globalsettings')
const isySystem = require('../isy/system')

async function reboot(id, cmd, data) {
  const { uuid } = data
  try {
    return await isySystem.reboot(uuid)
  } catch (err) {
    logger.error(`reboot: ${err.stack}`)
  }
  return { error: 'Failed, check log for details.' }
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
  }
  return { error: 'Not found' }
}

async function getSettings(id, cmd, data) {
  try {
    return settings.get()
  } catch (err) {
    logger.error(`getSettings: ${err.stack}`)
  }
  return { error: 'failed to get settings' }
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
  return { error: 'Nothing updated' }
}

const API = {
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
  }
}

module.exports = { API }
