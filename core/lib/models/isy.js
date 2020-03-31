const { v4: uuid } = require('uuid')
const encryption = require('../modules/security/encryption')

const config = require('../config/config')
const u = require('../utils/utils')

/**
 *  ISY Model
 * @module models/isy
 * @version 3.0
 */
// Returns array that is executed in order for Schema updates
const table = []
// pragma user_version = 1
table[0] = `
  CREATE TABLE IF NOT EXISTS "isy" (
    id BLOB PRIMARY KEY UNIQUE,
    uuid TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    ip TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT NOT NULL,
    password BLOB NOT NULL,
    enabled INTEGER NOT NULL CHECK (enabled IN (0,1)),
    discovered INTEGER NOT NULL CHECK (discovered IN (0,1)),
    version TEXT NOT NULL,
    secure INTEGER NOT NULL CHECK (secure IN (0,1)),
    dbVersion INTEGER
  )
`
class DEFAULTS {
  constructor() {
    this.id = uuid()
    this.uuid = 'unregistered'
    this.name = 'ISY'
    this.ip = null
    this.port = 80
    this.username = 'admin'
    this.password = 'admin'
    this.enabled = 1
    this.version = 'unknown'
    this.secure = 0
    this.discovered = 0
    this.dbVersion = table.length
  }
}

async function get(key) {
  if (!key) throw new Error(`isy get requires a uuid`)
  const isy = config.db.prepare(`SELECT * FROM isy WHERE (uuid) is (?)`).get(key)
  if (isy) {
    isy.password = await encryption.decryptText(isy.password)
  }
  return isy
}

async function getAll() {
  const isys = config.db.prepare(`SELECT * FROM isy`).all()
  if (isys) {
    return Promise.all(
      isys.map(async isy => {
        return {
          ...isy,
          password: await encryption.decryptText(isy.password)
        }
      })
    )
  }
  return isys
}

async function add(isy) {
  if (!isy || typeof isy !== 'object') throw new Error(`isy object not present or not an object`)
  if (!isy.uuid || !isy.ip) throw new Error(`isy object must contain uuid and ip at minimum`)
  const newIsy = new DEFAULTS()
  Object.assign(newIsy, isy)
  newIsy.password = encryption.encryptText(newIsy.password)
  return config.db
    .prepare(
      `INSERT INTO isy (${Object.keys(newIsy)})
    VALUES (${Object.keys(newIsy).fill('?')})`
    )
    .run(Object.values(newIsy))
}

async function update(key, updateObject) {
  if (key && updateObject && typeof updateObject === 'object') {
    const currentIsy = await get(`${key}`)
    if (currentIsy) {
      let updatedIsy = ``
      if (u.isIn('uuid', updateObject)) updatedIsy += `uuid = '${updateObject.uuid}',`
      if (u.isIn('name', updateObject)) updatedIsy += `name = '${updateObject.name}',`
      if (u.isIn('ip', updateObject)) updatedIsy += `ip = '${updateObject.ip}',`
      if (u.isIn('port', updateObject)) updatedIsy += `port = '${updateObject.port}',`
      if (u.isIn('username', updateObject)) updatedIsy += `username = '${updateObject.username}',`
      if (u.isIn('password', updateObject))
        updatedIsy += `password = '${await encryption.encryptText(updateObject.password)}',`
      if (u.isIn('enabled', updateObject)) updatedIsy += `enabled = '${updateObject.enabled}',`
      if (u.isIn('version', updateObject)) updatedIsy += `version = '${updateObject.version}',`
      if (u.isIn('secure', updateObject)) updatedIsy += `secure = '${updateObject.secure}',`
      if (Object.keys(updatedIsy).length > 0) {
        updatedIsy = updatedIsy.replace(/,\s*$/, '')
        config.db
          .prepare(
            `UPDATE isy SET
          ${updatedIsy}
          WHERE uuid is (?)`
          )
          .run(key)
      }
    } else throw new Error(`isy ${key} does not exist`)
  } else throw new Error(`updateIsy parameters not valid`)
}

async function remove(key) {
  if (!key) throw new Error(`remove isy requires uuid parameter`)
  return config.db.prepare(`DELETE FROM isy WHERE (uuid) is (?)`).run(key)
}

module.exports = { table, DEFAULTS, get, getAll, add, update, remove }
