const { v4: uuid } = require('uuid')

const config = require('../config/config')
const u = require('../utils/utils')

/**
 *  Nodeserver Model
 * @module models/nodeserver
 * @version 3.0
 */

const TABLENAME = 'driver'

// Returns array that is executed in order for Schema updates
const TABLE = []
// pragma user_version = 1
TABLE[0] = `
  CREATE TABLE IF NOT EXISTS "${TABLENAME}" (
    id BLOB PRIMARY KEY UNIQUE,
    uuid TEXT NOT NULL,
    profileNum INTEGER NOT NULL,
    address TEXT NOT NULL,
    driver TEXT NOT NULL,
    value BLOB,
    uom INTEGER,
    timeAdded INTEGER NOT NULL,
    timeModified INTEGER,
    dbVersion INTEGER,
    FOREIGN KEY (uuid, profileNum, address)
      REFERENCES node(uuid, profileNum, address)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    UNIQUE(uuid, profileNum, address, driver)
  );
  CREATE INDEX idx_${TABLENAME}_uuid_profileNum_address_driver
  ON ${TABLENAME} (uuid, profileNum, address, driver)
`
class DEFAULTS {
  constructor() {
    this.id = uuid()
    this.timeAdded = Date.now()
    this.timeModified = Date.now()
    this.dbVersion = TABLE.length
  }
}

const REQUIRED = ['uuid', 'profileNum', 'address', 'driver']
const IMMUTABLE = ['id', 'timeAdded', 'timeModified', 'dbVersion']
const MUTABLE = ['value', 'uom']

async function get(key, profileNum, address, driver) {
  if (!key || !profileNum || !address || !driver)
    throw new Error(`${TABLENAME} get requires a uuid, profileNum, address, and driver`)
  return config.db
    .prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid, profileNum, address, driver) is (?, ?, ?, ?)`)
    .get(key, profileNum, address, driver)
}

async function getAll() {
  return config.db.prepare(`SELECT * FROM ${TABLENAME}`).all()
}

async function getAllIsy(key) {
  return config.db.prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid) is (?)`).run(key)
}

async function getAllNodeServer(key, profileNum) {
  return config.db
    .prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid, profileNum) is (?, ?)`)
    .run(key, profileNum)
}

async function getAllNode(key, profileNum, address) {
  return config.db
    .prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid, profileNum, address) is (?, ?, ?)`)
    .run(key, profileNum, address)
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
  const newDriver = new DEFAULTS()
  // Overwrite defaults with passed in properties
  Object.assign(newDriver, newObj)
  // SQLite doesn't allow Boolean, so convert to 1/0
  Object.keys(newDriver).forEach(key => {
    if (typeof newDriver[key] === 'boolean') newDriver[key] = newDriver[key] ? 1 : 0
  })
  return config.db
    .prepare(
      `INSERT INTO ${TABLENAME} (${Object.keys(newDriver)})
    VALUES (${Object.keys(newDriver).fill('?')})`
    )
    .run(Object.values(newDriver))
}

async function update(key, profileNum, address, driver, updateObject) {
  if (
    !key ||
    !profileNum ||
    !address ||
    !driver ||
    !updateObject ||
    typeof updateObject !== 'object'
  )
    throw new Error(`update${TABLENAME} parameters not valid`)
  const current = await get(key, profileNum, address, driver)
  if (!current)
    throw new Error(`${TABLENAME} ${key}/${profileNum}/${address}/${driver} does not exist`)
  let updated = ``
  MUTABLE.forEach(item => {
    if (u.isIn(updateObject, item)) {
      if (typeof updateObject[item] === 'boolean')
        updated += `${item} = '${updateObject[item] ? 1 : 0}',`
      else updated += `${item} = '${updateObject[item]}',`
    }
  })
  if (updated.length <= 0) throw new Error(`${TABLENAME} ${key} nothing to update`)
  updated += `timeModified = ${Date.now()}`
  return config.db
    .prepare(
      `UPDATE ${TABLENAME} SET
        ${updated}
        WHERE (uuid, profileNum, address, driver) is (?, ?, ?, ?)`
    )
    .run(key, profileNum, address, driver)
}

async function remove(key, profileNum, address, driver) {
  if (!key || !profileNum || !address || !driver)
    throw new Error(`remove${TABLENAME} requires uuid, profileNum, address, and driver parameters`)
  return config.db
    .prepare(`DELETE FROM ${TABLENAME} WHERE (uuid, profileNum, address, driver) is (?, ?, ?, ?)`)
    .run(key, profileNum, address, driver)
}

async function set(key, profileNum, address, driver, value, uom = null) {
  if (!key || !profileNum || !address || !driver || !value)
    throw new Error(`setDriver requires uuid, profileNum, address, driver, and value parameters`)
  let updated = `value = ${value}`
  if (uom) updated += `, uom = ${uom}`
  updated += `, timeModified = ${Date.now()}`
  return config.db
    .prepare(
      `UPDATE ${TABLENAME} SET ${updated} WHERE (uuid, profileNum, address, driver) IS (?,?,?,?)`
    )
    .run(key, profileNum, address, driver)
}

async function TEST() {
  // Test API for driver
  let valid = false
  await add({
    uuid: '00:21:b9:02:45:1b',
    profileNum: 2,
    address: 'controller',
    driver: 'ST',
    value: 1,
    uom: 2
  })
  await add({
    uuid: '00:21:b9:02:45:1b',
    profileNum: 2,
    address: 'templateaddr',
    driver: 'ST',
    value: 1,
    uom: 2
  })
  // await update('abc123', 25, 'test', 'ST', { value: 223 })
  // await set('abc123', 25, 'test', 'ST', 224, 33)
  // const value = await get('abc123', 25, 'test', 'ST')
  // if (value.value === 33) valid = true
  // await remove('abc123', 25, 'test', 'ST')
  // return valid
}

module.exports = {
  TABLE,
  DEFAULTS,
  TEST,
  get,
  set,
  getAll,
  getAllIsy,
  getAllNodeServer,
  getAllNode,
  add,
  update,
  remove
}
