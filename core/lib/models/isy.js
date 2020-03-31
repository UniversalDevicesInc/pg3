const { v4: uuid } = require('uuid')
const bcrypt = require('bcrypt')

const config = require('../config/config')
/**
 *  User Model
 * @module models/user
 * @version 3.0
 */
// Returns array that is executed in order for Schema updates
const table = []
// pragma user_version = 1
table[0] = `
  CREATE TABLE IF NOT EXISTS "user" (
    id BLOB PRIMARY KEY UNIQUE,
    name TEXT NOT NULL UNIQUE,
    hash BLOB NOT NULL,
    enabled INTEGER,
    role TEXT,
    groups TEXT,
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
    this.dbVersion = table.length
  }
}

async function get(username) {
  return config.db.prepare(`SELECT id, name, enabled, role, groups FROM user WHERE (name) is (?)`).get(username)
}

async function add(username, password, role = null, groups = []) {
  if (!username || !password) {
    throw Error(`Username or password wasn't specified in addUser request`)
  }
  const newUser = new DEFAULTS()
  newUser.name = username
  newUser.hash = await bcrypt.hash(password, 10)
  if (role) newUser.role = role
  if (groups.length > 0) newUser.groups = JSON.stringify(groups)
  return config.db
    .prepare(
      `INSERT INTO user (${Object.keys(newUser)})
    VALUES (${Object.keys(newUser).fill('?')})`
    )
    .run(Object.values(newUser))
}

async function update(username, updateObject) {
  if (username && typeof updateObject === 'object') {
    const currentUser = await get(`${username}`)
    if (currentUser) {
      let updatedUser = ``
      if (Object.keys(updateObject).includes('password'))
        updatedUser += `hash = '${await bcrypt.hash(updateObject.password, 10)}',`
      if (Object.keys(updateObject).includes('role')) updatedUser += `role = '${updateObject.role}',`
      if (Object.keys(updateObject).includes('groups'))
        updatedUser += `groups = '${JSON.stringify(updateObject.groups)}',`
      if (Object.keys(updateObject).includes('enabled')) updatedUser += `enabled = ${updateObject.enabled ? 1 : 0},`
      updatedUser = updatedUser.replace(/,\s*$/, '')
      if (Object.keys(updatedUser).length > 0) {
        config.db
          .prepare(
            `UPDATE user SET
          ${updatedUser}
          WHERE name is (?)`
          )
          .run(username)
      }
    } else throw new Error(`User ${username} does not exist`)
  } else throw new Error(`updateUser parameters not valid`)
}

async function remove(username) {
  if (!username) {
    throw Error(`Username wasn't specified in deleteUser request`)
  }
  return config.db.prepare(`DELETE FROM user WHERE (name) is (?)`).run(username)
}

async function checkPassword(username, password) {
  const userObject = config.db.prepare(`SELECT hash FROM user WHERE (name) is (?)`).get(username)
  return userObject ? bcrypt.compare(password, userObject.hash) : false
}

module.exports = { table, DEFAULTS, get, add, update, remove, checkPassword }
