const { v4: uuid } = require('uuid')
const encryption = require('../modules/security/encryption')

const config = require('../config/config')
const u = require('../utils/utils')

/**
 *  Nodeserver Model
 * @module models/nodeserver
 * @version 3.0
 */
const TABLENAME = 'nodeserver'

// Returns array that is executed in order for Schema updates
const TABLE = []
// pragma user_version = 1
TABLE[0] = `
  CREATE TABLE IF NOT EXISTS "${TABLENAME}" (
    id BLOB PRIMARY KEY UNIQUE,
    uuid TEXT NOT NULL,
    token BLOB NOT NULL,
    name TEXT NOT NULL,
    nickname TEXT,
    profileNum INTEGER NOT NULL CHECK (profileNum BETWEEN 0 AND 25),
    timeAdded INTEGER NOT NULL,
    timeStarted INTEGER,
    timeModified INTEGER,
    version TEXT NOT NULL,
    branch TEXT NOT NULL,
    url TEXT NOT NULL,
    home TEXT NOT NULL,
    log TEXT NOT NULL,
    logLevel TEXT NOT NULL,
    enabled INTEGER NOT NULL CHECK (enabled IN (0,1)),
    connected INTEGER NOT NULL CHECK (connected IN (0,1)),
    devMode INTEGER NOT NULL CHECK (devMode IN (0,1)),
    type TEXT NOT NULL,
    executable TEXT NOT NULL,
    shortPoll INTEGER NOT NULL,
    longPoll INTEGER NOT NULL,
    customparams BLOB,
    customdata BLOB,
    customparamsdoc BLOB,
    customtypeddata BLOB,
    customtypedparams BLOB,
    notices BLOB,
    dbVersion INTEGER,
    FOREIGN KEY (uuid)
      REFERENCES isy(uuid)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    UNIQUE(uuid, profileNum)
  );
  CREATE INDEX idx_${TABLENAME}_uuid_profileNum
  ON ${TABLENAME} (uuid, profileNum)
`
class DEFAULTS {
  constructor() {
    this.id = uuid()
    this.token = encryption.randomString()
    this.enabled = 1
    this.connected = 0
    this.timeAdded = Date.now()
    this.timeModified = Date.now()
    this.log = 'logs/debug.log'
    this.logLevel = 'DEBUG'
    this.shortPoll = 60
    this.longPoll = 300
    this.branch = 'master'
    this.devMode = 0
    this.dbVersion = TABLE.length
  }
}

const REQUIRED = ['uuid', 'name', 'profileNum', 'version', 'home', 'type', 'executable', 'url']
const IMMUTABLE = ['id', 'timeAdded', 'timeModified', 'dbVersion']
const ENCRYPTED = [
  'customparams',
  'customdata',
  'customtypeddata',
  'customtypedparams',
  'customparamsdoc'
]
const MUTABLE = [
  'uuid',
  'token',
  'nickname',
  'profileNum',
  'version',
  'branch',
  'timeStarted',
  'home',
  'log',
  'logLevel',
  'enabled',
  'connected',
  'devMode',
  'shortPoll',
  'longPoll',
  'type',
  'executable',
  'customparams',
  'customdata',
  'customparamsdoc',
  'customtypeddata',
  'customtypedparams',
  'notices'
]

async function getColumn(key, profileNum, columnKey) {
  if (!key || !profileNum || !columnKey)
    throw new Error(`${TABLENAME} get requires a uuid, profileNum, and columnKey`)
  const value = config.db
    .prepare(`SELECT ${columnKey} FROM ${TABLENAME} WHERE (uuid, profileNum) is (?, ?)`)
    .get(key, profileNum)
  if (!value) return value
  Object.keys(value).forEach(item => {
    if (ENCRYPTED.includes(item)) value[item] = encryption.decryptText(value[item])
  })
  return value
}

async function get(key, profileNum) {
  if (!key || !profileNum) throw new Error(`${TABLENAME} get requires a uuid and profileNum`)
  const value = config.db
    // .prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid, profileNum) is (?, ?)`)
    .prepare(
      `SELECT nodeserver.*, COUNT(node.address) as nodeCount FROM nodeserver LEFT OUTER JOIN node USING (uuid, profileNum) WHERE (uuid, profileNum) is (?, ?) GROUP by nodeserver.profileNum`
    )
    .get(key, profileNum)
  if (!value) return value
  Object.keys(value).forEach(item => {
    if (ENCRYPTED.includes(item)) value[item] = encryption.decryptText(value[item])
  })
  return value
}

async function getIsy(key) {
  if (!key) throw new Error(`${TABLENAME} getIsy requires a uuid`)
  const items = config.db
    .prepare(
      `SELECT nodeserver.*, COUNT(node.address) as nodeCount FROM nodeserver LEFT OUTER JOIN node USING (uuid, profileNum) WHERE (uuid) is (?) GROUP by nodeserver.profileNum`
    )
    .all(key)
  items.map(value => {
    if (!value) return value
    Object.keys(value).map(item => {
      // eslint-disable-next-line
      if (ENCRYPTED.includes(item)) value[item] = encryption.decryptText(value[item])
      return item
    })
    return value
  })
  return items
}

async function getFull(key, profileNum) {
  if (!key || !profileNum) throw new Error(`${TABLENAME} getFull requires a uuid and profileNum`)
  const value = config.db
    .prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid, profileNum) is (?, ?)`)
    .get(key, profileNum)
  if (!value) return value
  Object.keys(value).forEach(item => {
    if (ENCRYPTED.includes(item)) value[item] = encryption.decryptText(value[item])
  })
  value.nodes =
    config.db
      .prepare(`SELECT * FROM node WHERE (uuid, profileNum) is (?, ?)`)
      .all(key, profileNum) || []
  value.nodes.map(node => {
    // eslint-disable-next-line no-param-reassign
    node.drivers =
      config.db
        .prepare(`SELECT * FROM driver WHERE (uuid, profileNum, address) is (?, ?, ?)`)
        .all(key, profileNum, node.address) || []
    return node
  })
  return value
}

async function getIsyFull(key) {
  if (!key) throw new Error(`${TABLENAME} getIsyFull requires a uuid`)
  const items = config.db.prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid) is (?)`).all(key)
  items.map(value => {
    if (!value) return value
    Object.keys(value).map(item => {
      // eslint-disable-next-line
      if (ENCRYPTED.includes(item)) value[item] = encryption.decryptText(value[item])
      return item
    })
    // eslint-disable-next-line no-param-reassign
    value.nodes =
      config.db
        .prepare(`SELECT * FROM node WHERE (uuid, profileNum) is (?, ?)`)
        .all(key, value.profileNum) || []
    value.nodes.map(node => {
      // eslint-disable-next-line no-param-reassign
      node.drivers =
        config.db
          .prepare(`SELECT * FROM driver WHERE (uuid, profileNum, address) is (?, ?, ?)`)
          .all(key, value.profileNum, node.address) || []
      return node
    })
    return value
  })
  return items
}

async function getAll() {
  return config.db.prepare(`SELECT * FROM ${TABLENAME}`).all()
}

async function getAllInstalled() {
  return config.db.prepare(`SELECT * FROM ${TABLENAME} WHERE (type) IS NOT (?)`).all('unmanaged')
}

async function add(obj) {
  if (!obj || typeof obj !== 'object')
    throw new Error(`${TABLENAME} object not present or not an object`)
  // Deepcopy hack
  const newObj = JSON.parse(JSON.stringify(obj))
  // Can't overwrite internal properties. Nice try.
  IMMUTABLE.forEach(key => delete newObj[key])
  const checkProps = u.verifyProps(newObj, REQUIRED)
  if (!checkProps.valid) throw new Error(`${TABLENAME} object missing ${checkProps.missing}`)
  const newNs = new DEFAULTS()
  // Verify add object only has appropriate properties
  Object.keys(newObj).forEach(key => {
    if (!REQUIRED.concat(IMMUTABLE, MUTABLE).includes(key)) delete newObj[key]
  })
  // Overwrite defaults with passed in properties
  Object.assign(newNs, newObj)
  // SQLite doesn't allow Boolean, so convert to 1/0
  Object.keys(newNs).forEach(key => {
    if (typeof newNs[key] === 'boolean') newNs[key] = newNs[key] ? 1 : 0
  })
  Object.keys(newNs).forEach(key => {
    if (ENCRYPTED.includes(key)) newNs[key] = encryption.encryptText(newNs[key])
  })
  return config.db
    .prepare(
      `INSERT INTO ${TABLENAME} (${Object.keys(newNs)})
    VALUES (${Object.keys(newNs).fill('?')})`
    )
    .run(Object.values(newNs))
}

async function update(key, profileNum, updateObject) {
  if (!key || !profileNum || !updateObject || typeof updateObject !== 'object')
    throw new Error(`update${TABLENAME} parameters not valid`)
  const current = await get(`${key}`, profileNum)
  if (!current) throw new Error(`${TABLENAME} ${key}/${profileNum} does not exist`)
  let updated = ``
  MUTABLE.forEach(item => {
    if (u.isIn(updateObject, item)) {
      if (typeof updateObject[item] === 'boolean')
        updated += `${item} = '${updateObject[item] ? 1 : 0}',`
      else if (ENCRYPTED.includes(item))
        updated += `${item} = '${encryption.encryptText(updateObject[item])}',`
      else updated += `${item} = '${updateObject[item]}',`
    }
  })
  if (updated.length <= 0) throw new Error(`${TABLENAME} ${key} nothing to update`)
  updated += `timeModified = ${Date.now()}`
  return config.db
    .prepare(
      `UPDATE ${TABLENAME} SET
          ${updated}
          WHERE (uuid, profileNum) is (?, ?)`
    )
    .run(key, profileNum)
}

async function remove(key, profileNum) {
  if (!key || !profileNum)
    throw new Error(`remove ${TABLENAME} requires uuid and profileNum parameters`)
  return config.db
    .prepare(`DELETE FROM ${TABLENAME} WHERE (uuid, profileNum) is (?, ?)`)
    .run(key, profileNum)
}

// async function TEST() {
//   // Test API for nodeserver
//   let valid = false
//   await add({
//     uuid: '00:21:b9:02:45:1b',
//     name: 'PythonTemplate',
//     profileNum: 2,
//     version: '1.2',
//     home: '~/.pg3/ns/test',
//     type: 'python3',
//     executable: 'template-poly.py',
//     longPoll: 240,
//     shortPoll: 120
//   })
//   // await update('00:21:b9:02:45:1b', 25, { enabled: true })
//   // const value = await get('00:21:b9:02:45:1b', 25)
//   // if (value.enabled) valid = true
//   // await remove('abc123', 25)
//   return valid
// }

module.exports = {
  TABLE,
  DEFAULTS,
  getColumn,
  get,
  getAll,
  getAllInstalled,
  getIsy,
  getFull,
  getIsyFull,
  add,
  update,
  remove
}
