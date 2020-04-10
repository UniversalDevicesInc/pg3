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
const TABLE = []
// pragma user_version = 1
TABLE[0] = `
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
    timeAdded INTEGER NOT NULL,
    timeModified INTEGER,
    dbVersion INTEGER
  )
`
class DEFAULTS {
  constructor() {
    this.id = uuid()
    this.uuid = 'unregistered'
    this.name = 'ISY'
    this.port = 80
    this.username = 'admin'
    this.password = 'admin'
    this.enabled = 1
    this.version = 'unknown'
    this.secure = 0
    this.discovered = 0
    this.timeAdded = Date.now()
    this.timeModified = Date.now()
    this.dbVersion = TABLE.length
  }
}

const REQUIRED = ['uuid', 'ip']
const IMMUTABLE = ['id', 'timeAdded', 'timeModified', 'dbVersion', 'discovered']
const MUTABLE = ['uuid', 'name', 'ip', 'port', 'username', 'enabled', 'version', 'secure']

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

async function add(obj) {
  if (!obj || typeof obj !== 'object') throw new Error(`isy object not present or not an object`)
  // Deepcopy hack
  const newObj = JSON.parse(JSON.stringify(obj))
  // Can't overwrite internal properties. Nice try.
  IMMUTABLE.forEach(key => delete newObj[key])
  const checkProps = u.verifyProps(newObj, REQUIRED)
  if (!checkProps.valid) throw new Error(`isy object missing ${checkProps.missing}`)
  const newIsy = new DEFAULTS()
  Object.assign(newIsy, newObj)
  // SQLite doesn't allow Boolean, so convert to 1/0
  Object.keys(newIsy).forEach(key => {
    if (typeof newIsy[key] === 'boolean') newIsy[key] = newIsy[key] ? 1 : 0
  })
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
    const current = await get(`${key}`)
    if (current) {
      let updated = ``
      MUTABLE.forEach(item => {
        if (u.isIn(updateObject, item)) {
          if (typeof updateObject[item] === 'boolean')
            updated += `${item} = '${updateObject[item] ? 1 : 0}',`
          else updated += `${item} = '${updateObject[item]}',`
        }
      })
      if (u.isIn(updateObject, 'password'))
        updated += `password = '${await encryption.encryptText(updateObject.password)}',`
      if (updated.length > 0) {
        updated += `timeModified = ${Date.now()}`
        config.db
          .prepare(
            `UPDATE isy SET
          ${updated}
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

module.exports = { TABLE, DEFAULTS, get, getAll, add, update, remove }
