/* eslint-disable
  no-use-before-define
  */
const logger = require('../logger')
const u = require('../../utils/utils')

const ns = require('../../models/nodeserver')

const KEYS = [
  'customparams',
  'customdata',
  'customparamsdoc',
  'customtypeddata',
  'customtypedparams',
  'notices'
]

async function set([uuid, profileNum], cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  return Promise.all(
    Object.values(data).map(async item => {
      const result = {}
      try {
        if (typeof item !== 'object') throw new Error(`driver object invalid`)
        if (!u.hasProps(item, API[cmd].props))
          throw new Error(`${cmd} object does not have the correct properties`)
        if (!KEYS.includes(item.key)) throw new Error(`${item.key} is not a mutable property`)
        const updateObject = {
          [item.key]: typeof item.value === 'object' ? JSON.stringify(item.value) : item.value
        }
        await ns.update(uuid, profileNum, updateObject)
        logger.info(`[${uuid}_${profileNum}] Set ${item.key}`)
        return { ...result, success: true, [item.key]: item.value }
      } catch (err) {
        logger.error(`command ${cmd} ${err.message}`)
        return { ...result, success: false, error: err.message }
      }
    })
  )
}

async function get([uuid, profileNum], cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  return Promise.all(
    Object.values(data).map(async item => {
      const result = {}
      try {
        if (typeof item !== 'object') throw new Error(`driver object invalid`)
        if (!u.hasProps(item, API[cmd].props))
          throw new Error(`${cmd} object does not have the correct properties`)
        if (!KEYS.includes(item.key)) throw new Error(`${item.key} is not a valid property`)
        const value = await ns.getColumn(uuid, profileNum, item.key)
        logger.info(`[${uuid}_${profileNum}] Retrieved ${item.key}`)
        return { ...result, ...value }
      } catch (err) {
        logger.error(`command ${cmd} ${err.message}`)
        return { ...result, error: err.message }
      }
    })
  )
}

const API = {
  set: {
    props: ['key', 'value'],
    func: set
  },
  get: {
    props: ['key'],
    func: get
  }
}

module.exports = { API }
