const { v4: uuid } = require('uuid')
const bcrypt = require('bcrypt')

const config = require('../config/config')

/**
 *  User Model
 * @module models/user
 * @version 3.0
 */
const TABLENAME = 'user'

// Returns array that is executed in order for Schema updates
const TABLE = []
// pragma user_version = 1
TABLE[0] = `
  CREATE TABLE IF NOT EXISTS "${TABLENAME}" (
    id BLOB PRIMARY KEY UNIQUE,
    name TEXT NOT NULL UNIQUE,
    hash BLOB NOT NULL,
    enabled INTEGER NOT NULL CHECK (enabled IN (0,1)),
    role TEXT,
    groups TEXT,
    timeAdded INTEGER NOT NULL,
    timeModified INTEGER,
    dbVersion INTEGER
  )
`
class DEFAULTS {
  constructor() {
    this.id = uuid()
    this.name = null
    this.hash = null
    this.enabled = 1
    this.role = 'admin'
    this.groups = JSON.stringify(['Administrators'])
    this.timeAdded = Date.now()
    this.timeModified = Date.now()
    this.dbVersion = TABLE.length
  }
}

const protectedKeys = ['admin']

async function get(username) {
  return config.db
    .prepare(`SELECT id, name, enabled, role, groups FROM user WHERE (name) is (?)`)
    .get(username)
}

async function getById(id) {
  return config.db
    .prepare(`SELECT id, name, enabled, role, groups FROM user WHERE (id) is (?)`)
    .get(id)
}

async function add(username, password, role = null, groups = []) {
  if (!username || !password)
    throw new Error(`Username or password wasn't specified in add${TABLENAME} request`)
  if (protectedKeys.includes(username)) throw new Error(`${username} is protected`)
  const newUser = new DEFAULTS()
  newUser.name = username
  newUser.hash = await bcrypt.hash(password, 10)
  if (role) newUser.role = role
  if (groups.length > 0) newUser.groups = JSON.stringify(groups)
  return config.db
    .prepare(
      `INSERT INTO ${TABLENAME} (${Object.keys(newUser)})
    VALUES (${Object.keys(newUser).fill('?')})`
    )
    .run(Object.values(newUser))
}

async function update(username, updateObject) {
  if (!username || typeof updateObject !== 'object')
    throw new Error(`updateUser parameters not valid`)
  const currentUser = await get(`${username}`)
  if (!currentUser) throw new Error(`User ${username} does not exist`)
  let updatedUser = ``
  if (Object.keys(updateObject).includes('password'))
    updatedUser += `hash = '${await bcrypt.hash(updateObject.password, 10)}',`
  if (Object.keys(updateObject).includes('role')) updatedUser += `role = '${updateObject.role}',`
  if (Object.keys(updateObject).includes('groups'))
    updatedUser += `groups = '${JSON.stringify(updateObject.groups)}',`
  if (Object.keys(updateObject).includes('enabled'))
    updatedUser += `enabled = ${updateObject.enabled ? 1 : 0},`
  if (updatedUser.length <= 0) throw new Error(`Nothing to update`)
  updatedUser += `timeModified = ${Date.now()}`
  return config.db
    .prepare(
      `UPDATE ${TABLENAME} SET
          ${updatedUser}
          WHERE name is (?)`
    )
    .run(username)
}

async function remove(username) {
  if (!username) throw new Error(`Username wasn't specified in deleteUser request`)
  if (protectedKeys.includes(username)) throw new Error(`${username} is protected`)
  return config.db.prepare(`DELETE FROM ${TABLENAME} WHERE (name) is (?)`).run(username)
}

async function checkPassword(username, password) {
  const userObject = config.db
    .prepare(`SELECT hash FROM ${TABLENAME} WHERE (name) is (?)`)
    .get(username)
  return userObject ? bcrypt.compare(password, userObject.hash) : false
}

async function TEST() {
  // Tests API for user
  await add('bob', 'test123')
  await update('bob', { password: 'test333', enabled: false })
  let valid = false
  if (await checkPassword('bob', 'test333')) valid = true
  await remove('bob')
  return valid
}

module.exports = { TABLE, DEFAULTS, TEST, get, getById, add, update, remove, checkPassword }
