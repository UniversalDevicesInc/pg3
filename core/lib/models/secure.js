const { v4: uuid } = require('uuid')

const config = require('../config/config')
const encryption = require('../modules/encryption')

/**
 *  Secure Model
 * @module models/secure
 * @version 3.0
 */
// Returns array that is executed in order for Schema updates
const table = []
// pragma user_version = 1
table[0] = `
  CREATE TABLE IF NOT EXISTS "secure" (
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
    this.dbVersion = table.length
  }
}

const protectedKeys = ['pg3key']

async function get(key) {
  if (!key) throw new Error(`secure get requires a key`)
  if (protectedKeys.includes(key)) throw new Error(`${key} is protected`)
  const entry = config.db.prepare(`SELECT * FROM secure WHERE (key) is (?)`).get(key)
  if (!entry) return null
  return encryption.decryptText(entry.value)
}

async function add(key, value) {
  if (!key || !value) throw new Error(`secure add requires a key`)
  if (protectedKeys.includes(key)) throw new Error(`${key} is protected`)
  const newKey = new DEFAULTS()
  newKey.key = key
  newKey.value = encryption.encryptText(JSON.stringify(value))
  return config.db
    .prepare(
      `INSERT INTO secure (${Object.keys(newKey)})
    VALUES (${Object.keys(newKey).fill('?')})`
    )
    .run(Object.values(newKey))
}

async function update(key, value) {
  if (!key) throw new Error(`secure update requires a key and a value`)
  if (protectedKeys.includes(key)) throw new Error(`${key} is protected`)
  const currentKey = await get(key)
  if (!currentKey) throw new Error(`secure key ${key} does not exist`)
  else {
    const encryptedValue = encryption.encryptText(JSON.stringify(value))
    return config.db.prepare(`UPDATE secure SET value = (?) WHERE (key) is (?)`).run(encryptedValue, key)
  }
}

async function remove(key) {
  if (!key) throw new Error(`secure remove requires a key`)
  if (protectedKeys.includes(key)) throw new Error(`${key} is protected`)
  const currentKey = await get(key)
  if (!currentKey) throw new Error(`${key} doesn't exist`)
  else return config.db.prepare(`DELETE FROM secure WHERE (key) is (?)`).run(key)
}

module.exports = { table, DEFAULTS, get, add, update, remove }
