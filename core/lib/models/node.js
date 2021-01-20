const { v4: uuid } = require('uuid')

const config = require('../config/config')
const u = require('../utils/utils')
const frontendcore = require('../modules/frontend/core')
const ns = require('./nodeserver')
// const logger = require('../modules/logger')

/**
 *  Node Model
 * @module models/node
 * @version 3.0
 */
const TABLENAME = 'node'

// Returns array that is executed in order for Schema updates
const TABLE = []
// pragma user_version = 1
TABLE[0] = `
  CREATE TABLE IF NOT EXISTS "${TABLENAME}" (
    id BLOB PRIMARY KEY UNIQUE,
    uuid TEXT NOT NULL,
    profileNum INTEGER NOT NULL,
    address TEXT NOT NULL,
    name TEXT,
    nodeDefId TEXT,
    nls TEXT,
    hint TEXT,
    controller INTEGER NOT NULL CHECK (controller IN (0,1)),
    primaryNode TEXT,
    private BLOB,
    isPrimary INTEGER NOT NULL CHECK (isPrimary IN (0,1)),
    enabled INTEGER NOT NULL CHECK (enabled IN (0,1)),
    timeAdded INTEGER NOT NULL,
    timeModified INTEGER,
    dbVersion INTEGER,
    FOREIGN KEY (uuid, profileNum)
      REFERENCES nodeserver(uuid, profileNum)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    UNIQUE(uuid, profileNum, address)
  );
  CREATE INDEX idx_${TABLENAME}_uuid_profileNum_address
  ON ${TABLENAME} (uuid, profileNum, address)
`
class DEFAULTS {
  constructor() {
    this.id = uuid()
    this.enabled = 1
    this.controller = 0
    this.isPrimary = 0
    this.hint = '0x00000000'
    this.private = null
    this.timeAdded = Date.now()
    this.timeModified = Date.now()
    this.dbVersion = TABLE.length
  }
}

const REQUIRED = ['uuid', 'profileNum', 'address', 'primaryNode']
const IMMUTABLE = ['id', 'timeAdded', 'timeModified', 'dbVersion']
const MUTABLE = ['name', 'nodeDefId', 'hint', 'controller', 'isPrimary', 'enabled', 'private']

async function get(key, profileNum, address) {
  if (!key || !profileNum || !address)
    throw new Error(`${TABLENAME} get requires a uuid, profileNum, and address`)
  return config.db
    .prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid, profileNum, address) is (?, ?, ?)`)
    .get(key, profileNum, address)
}

async function getChildren(key, profileNum, primaryNode) {
  if (!key || !profileNum || !primaryNode)
    throw new Error(`${TABLENAME} get requires a uuid, profileNum, and primaryNode`)
  return config.db
    .prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid, profileNum, primaryNode) is (?, ?, ?)`)
    .get(key, profileNum, primaryNode)
}

async function getAll() {
  return config.db.prepare(`SELECT * FROM ${TABLENAME}`).all()
}

async function getAllIsy(key) {
  return config.db.prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid) is (?)`).all(key)
}

async function getAllNodeServer(key, profileNum) {
  if (!key || !profileNum)
    throw new Error(`${TABLENAME} getAllNodeServer requires a uuid and profileNum`)
  const nodes = config.db
    .prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid, profileNum) is (?, ?)`)
    .all(key, profileNum)
  if (!nodes) return nodes
  nodes.map(node => {
    // eslint-disable-next-line no-param-reassign
    node.drivers =
      config.db
        .prepare(`SELECT * FROM driver WHERE (uuid, profileNum, address) is (?, ?, ?)`)
        .all(key, profileNum, node.address) || []
    return node
  })
  return nodes
}

async function add(obj) {
  if (!obj || typeof obj !== 'object')
    throw new Error(`${TABLENAME} object not present or not an object`)
  // Deepcopy hack
  const newObj = JSON.parse(JSON.stringify(obj))
  // Can't overwrite internal properties. Nice try.
  IMMUTABLE.forEach(key => delete newObj[key])
  // Verify add object only has appropriate properties
  Object.keys(newObj).forEach(key => {
    if (!REQUIRED.concat(IMMUTABLE, MUTABLE).includes(key)) delete newObj[key]
  })
  const checkProps = u.verifyProps(newObj, REQUIRED)
  if (!checkProps.valid) throw new Error(`${TABLENAME} object missing ${checkProps.missing}`)
  const newNode = new DEFAULTS()
  // Overwrite defaults with passed in properties
  Object.assign(newNode, newObj)
  // SQLite doesn't allow Boolean, so convert to 1/0
  Object.keys(newNode).forEach(key => {
    if (typeof newNode[key] === 'boolean') newNode[key] = newNode[key] ? 1 : 0
  })
  newNode.isPrimary = newNode.address === newNode.primaryNode ? 1 : 0
  newNode.hint = u.convertHint(newNode.hint)
  await config.db
    .prepare(
      `INSERT INTO ${TABLENAME} (${Object.keys(newNode)})
    VALUES (${Object.keys(newNode).fill('?')})`
    )
    .run(Object.values(newNode))
  return frontendcore.frontendMessage({ getNs: await ns.getFull(newNode.uuid, newNode.profileNum) })
}

async function update(key, profileNum, address, updateObject) {
  if (!key || !profileNum || !address || !updateObject || typeof updateObject !== 'object')
    throw new Error(`update${TABLENAME} parameters not valid`)
  const current = await get(key, profileNum, address)
  if (!current) throw new Error(`${TABLENAME} ${key}/${profileNum}/${address} does not exist`)
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
  await config.db
    .prepare(
      `UPDATE ${TABLENAME} SET
          ${updated}
          WHERE (uuid, profileNum, address) is (?, ?, ?)`
    )
    .run(key, profileNum, address)
  return frontendcore.frontendMessage({ getNs: await ns.getFull(key, profileNum) })
}

async function remove(key, profileNum, address) {
  if (!key || !profileNum || !address)
    throw new Error(`remove ${TABLENAME} requires uuid, profileNum, and address parameters`)
  const children = await getChildren(key, profileNum, address)
  if (children && Array.isArray(children)) {
    await Promise.all(
      children.map(async item => {
        return config.db
          .prepare(`DELETE FROM ${TABLENAME} WHERE (uuid, profileNum, address) is (?, ?, ?)`)
          .run(key, profileNum, item.address)
      })
    )
  }
  await config.db
    .prepare(`DELETE FROM ${TABLENAME} WHERE (uuid, profileNum, address) is (?, ?, ?)`)
    .run(key, profileNum, address)
  return frontendcore.frontendMessage({ getNs: await ns.getFull(key, profileNum) })
}

// async function TEST() {
//   // Test API for node
//   let valid = false
//   await add({
//     uuid: '00:21:b9:02:45:1b',
//     profileNum: 2,
//     address: 'controller',
//     nodeDefId: 'controller'
//   })
//   await add({
//     uuid: '00:21:b9:02:45:1b',
//     profileNum: 2,
//     address: 'templateaddr',
//     nodeDefId: 'templatenodeid'
//   })
//   await update('test123', 25, 'test', { nodeDefId: 'abc124' })
//   const value = await get('00:21:b9:02:45:1b', 25, 'test')
//   if (value.nodeDefId === 'abc124') valid = true
//   await remove('test123', 25, 'test')
//   return valid
// }

module.exports = {
  TABLE,
  DEFAULTS,
  REQUIRED,
  // TEST,
  get,
  getChildren,
  getAll,
  getAllIsy,
  getAllNodeServer,
  add,
  update,
  remove
}
