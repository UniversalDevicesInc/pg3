/* eslint-disable
  no-use-before-define,
  no-empty
  */
const logger = require('../logger')
const u = require('../../utils/utils')

const custom = require('../../models/custom')

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
  if (data.length <= 0) throw new Error(`${cmd} has no entries.`)
  return Promise.all(
    Object.values(data).map(async item => {
      try {
        if (typeof item !== 'object') throw new Error(`custom object invalid`)
        if (!u.hasProps(item, API[cmd].props))
          throw new Error(
            `${cmd} object does not have the correct properties :: ${JSON.stringify(item)}`
          )
        if (!KEYS.includes(item.key)) throw new Error(`${item.key} is not a mutable property`)
        const value = typeof item.value === 'object' ? JSON.stringify(item.value) : item.value
        await custom.add(uuid, profileNum, item.key, value)
        logger.info(`[${uuid}_${profileNum}] Set ${item.key}`)
        return { success: true, key: item.key }
      } catch (err) {
        logger.error(`command ${cmd} ${err.message}`)
        return { success: false, key: item.key, error: err.message }
      }
    })
  )
}

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
