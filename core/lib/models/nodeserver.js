const { v4: uuid } = require('uuid')
const encryption = require('../modules/security/encryption')

const config = require('../config/config')
const u = require('../utils/utils')

/**
 *  Nodeserver Model
 * @module models/nodeserver
 * @version 3.0
 */
// Returns array that is executed in order for Schema updates
const TABLE = []
// pragma user_version = 1
TABLE[0] = `
  CREATE TABLE IF NOT EXISTS "nodeserver" (
    id BLOB PRIMARY KEY UNIQUE,
    uuid TEXT NOT NULL,
    token BLOB NOT NULL,
    name TEXT NOT NULL,
    profileNum INTEGER NOT NULL CHECK (profileNum BETWEEN 0 AND 25),
    timeAdded INTEGER NOT NULL,
    timeStarted INTEGER,
    timeModified INTEGER,
    version TEXT NOT NULL,
    home TEXT NOT NULL,
    log TEXT NOT NULL,
    logLevel TEXT NOT NULL,
    enabled INTEGER NOT NULL CHECK (enabled IN (0,1)),
    type TEXT NOT NULL,
    executable TEXT NOT NULL,
    shortPoll INTEGER NOT NULL,
    longPoll INTEGER NOT NULL,
    customParams BLOB,
    customData BLOB,
    customParamsDoc BLOB,
    typedCustomData BLOB,
    typedParams BLOB,
    notices BLOB,
    dbVersion INTEGER,
    FOREIGN KEY (uuid)
      REFERENCES isy(uuid)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    UNIQUE(uuid, profileNum)
  );
  CREATE INDEX idx_nodeserver_uuid_profileNum
  ON nodeserver (uuid, profileNum)
`
class DEFAULTS {
  constructor() {
    this.id = uuid()
    this.token = encryption.randomString()
    this.enabled = 1
    this.timeAdded = Date.now()
    this.timeModified = Date.now()
    this.log = 'logs/debug.log'
    this.logLevel = 'DEBUG'
    this.shortPoll = 10
    this.longPoll = 30
    this.dbVersion = TABLE.length
  }
}

const REQUIRED = ['uuid', 'name', 'profileNum', 'version', 'home', 'type', 'executable']
const IMMUTABLE = ['id', 'timeAdded', 'timeModified', 'dbVersion']
const MUTABLE = [
  'uuid',
  'token',
  'name',
  'profileNum',
  'version',
  'timeStarted',
  'home',
  'log',
  'logLevel',
  'enabled',
  'shortPoll',
  'longPoll',
  'customParams',
  'customData',
  'customParamsDoc',
  'typedCustomData',
  'typedParams',
  'notices'
]

async function get(key, profileNum) {
  if (!key || !profileNum) throw new Error(`nodeserver get requires a uuid and profileNum`)
  return config.db
    .prepare(`SELECT * FROM nodeserver WHERE (uuid, profileNum) is (?, ?)`)
    .get(key, profileNum)
}

async function getAll() {
  return config.db.prepare(`SELECT * FROM nodeserver`).all()
}

async function add(obj) {
  if (!obj || typeof obj !== 'object')
    throw new Error(`nodeserver object not present or not an object`)
  // Deepcopy hack
  const newObj = JSON.parse(JSON.stringify(obj))
  // Can't overwrite internal properties. Nice try.
  IMMUTABLE.forEach(key => delete newObj[key])
  const checkProps = u.verifyProps(newObj, REQUIRED)
  if (!checkProps.valid) throw new Error(`nodeserver object missing ${checkProps.missing}`)
  const newNs = new DEFAULTS()
  // Overwrite defaults with passed in properties
  Object.assign(newNs, newObj)
  // SQLite doesn't allow Boolean, so convert to 1/0
  Object.keys(newNs).forEach(key => {
    if (typeof newNs[key] === 'boolean') newNs[key] = newNs[key] ? 1 : 0
  })
  return config.db
    .prepare(
      `INSERT INTO nodeserver (${Object.keys(newNs)})
    VALUES (${Object.keys(newNs).fill('?')})`
    )
    .run(Object.values(newNs))
}

async function update(key, profileNum, updateObject) {
  if (key && profileNum && updateObject && typeof updateObject === 'object') {
    const current = await get(`${key}`, profileNum)
    if (current) {
      let updated = ``
      MUTABLE.forEach(item => {
        if (u.isIn(updateObject, item)) {
          if (typeof updateObject[item] === 'boolean')
            updated += `${item} = '${updateObject[item] ? 1 : 0}',`
          else updated += `${item} = '${updateObject[item]}',`
        }
      })
      if (updated.length > 0) {
        updated += `timeModified = ${Date.now()}`
        return config.db
          .prepare(
            `UPDATE nodeserver SET
          ${updated}
          WHERE (uuid, profileNum) is (?, ?)`
          )
          .run(key, profileNum)
      }
    } else throw new Error(`nodeserver ${key}/${profileNum} does not exist`)
  } else throw new Error(`updateNs parameters not valid`)
  return null
}

async function remove(key, profileNum) {
  if (!key || !profileNum)
    throw new Error(`remove nodeserver requires uuid and profileNum parameters`)
  return config.db
    .prepare(`DELETE FROM nodeserver WHERE (uuid, profileNum) is (?, ?)`)
    .run(key, profileNum)
}

module.exports = { TABLE, DEFAULTS, get, getAll, add, update, remove }
