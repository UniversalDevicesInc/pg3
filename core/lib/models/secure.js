const { v4: uuid } = require('uuid')

const config = require('../config/config')
const encryption = require('../modules/security/encryption')

/**
 *  Secure Model
 * @module models/secure
 * @version 3.0
 */
const TABLENAME = 'secure'

// Returns array that is executed in order for Schema updates
const TABLE = []
// pragma user_version = 1
TABLE[0] = `
  CREATE TABLE IF NOT EXISTS "${TABLENAME}" (
    id BLOB PRIMARY KEY UNIQUE,
    key TEXT NOT NULL UNIQUE,
    value BLOB NOT NULL,
    dbVersion INTEGER
  )
`
class DEFAULTS {
  constructor() {
    this.id = uuid()
    this.key = ''
    this.value = JSON.stringify({})
    this.dbVersion = TABLE.length
  }
}

const protectedKeys = ['pg3key']

async function get(key) {
  if (!key) throw new Error(`${TABLENAME} get requires a key`)
  if (protectedKeys.includes(key)) throw new Error(`${key} is protected`)
  const entry = config.db.prepare(`SELECT * FROM ${TABLENAME} WHERE (key) is (?)`).get(key)
  if (!entry) return null
  return encryption.decryptText(entry.value)
}

async function add(key, value) {
  if (!key || !value) throw new Error(`${TABLENAME} add requires a key`)
  if (protectedKeys.includes(key)) throw new Error(`${key} is protected`)
  const newKey = new DEFAULTS()
  newKey.key = key
  newKey.value = encryption.encryptText(JSON.stringify(value))
  return config.db
    .prepare(
      `INSERT INTO ${TABLENAME} (${Object.keys(newKey)})
    VALUES (${Object.keys(newKey).fill('?')})`
    )
    .run(Object.values(newKey))
}

async function update(key, value) {
  if (!key) throw new Error(`${TABLENAME} update requires a key and a value`)
  if (protectedKeys.includes(key)) throw new Error(`${key} is protected`)
  const currentKey = await get(key)
  if (!currentKey) throw new Error(`${TABLENAME} key ${key} does not exist`)
  const encryptedValue = encryption.encryptText(JSON.stringify(value))
  return config.db
    .prepare(`UPDATE ${TABLENAME} SET value = (?) WHERE (key) is (?)`)
    .run(encryptedValue, key)
}

async function remove(key) {
  if (!key) throw new Error(`${TABLENAME} remove requires a key`)
  if (protectedKeys.includes(key)) throw new Error(`${key} is protected`)
  const currentKey = await get(key)
  if (!currentKey) throw new Error(`${key} doesn't exist`)
  return config.db.prepare(`DELETE FROM ${TABLENAME} WHERE (key) is (?)`).run(key)
}

async function TEST() {
  // Tests API for secure
  let valid = false
  await add('test', '123')
  await update('test', 456)
  const output = await get('test')
  if (output === 456) valid = true
  await remove('test')
  return valid
}

module.exports = { TABLE, DEFAULTS, TEST, get, add, update, remove }
