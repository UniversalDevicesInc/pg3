const { v4: uuid } = require('uuid')

const config = require('../config/config')
const encryption = require('../modules/security/encryption')

/**
 *  Custom Model
 * @module models/custom
 * @version 3.0
 */
const TABLENAME = 'custom'

// Returns array that is executed in order for Schema updates
const TABLE = []
// pragma user_version = 1
TABLE[0] = `
  CREATE TABLE IF NOT EXISTS "${TABLENAME}" (
    id BLOB PRIMARY KEY UNIQUE,
    uuid TEXT NOT NULL,
    profileNum INTEGER NOT NULL,
    key TEXT NOT NULL,
    value BLOB,
    dbVersion INTEGER,
    FOREIGN KEY (uuid, profileNum)
      REFERENCES nodeserver(uuid, profileNum)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    UNIQUE(uuid, profileNum, key)
  );
  CREATE INDEX idx_${TABLENAME}_uuid_profileNum_key
  ON ${TABLENAME} (uuid, profileNum, key)
`
class DEFAULTS {
  constructor() {
    this.id = uuid()
    this.uuid = null
    this.profileNum = null
    this.key = null
    this.value = null
    this.dbVersion = TABLE.length
  }
}

async function get(id, profileNum, key) {
  if (!key) throw new Error(`${TABLENAME} get requires a uuid, profileNum, and key`)
  const entry = config.db
    .prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid, profileNum, key) is (?, ?, ?)`)
    .get(id, profileNum, key)
  if (!entry) return null
  if (!entry.value) return entry
  entry.value = encryption.decryptText(entry.value)
  return entry
}

async function getAll(key, profileNum) {
  const entries = config.db
    .prepare(`SELECT * FROM ${TABLENAME} WHERE (uuid, profileNum) is (?, ?)`)
    .all(key, profileNum)
  Promise.allSettled(
    entries.map(item => {
      if (!item.value) return item
      // eslint-disable-next-line no-param-reassign
      item.value = encryption.decryptText(item.value)
      return item
    })
  )
  return entries
}

async function add(id, profileNum, key, value) {
  if (!key || !value) throw new Error(`${TABLENAME} add requires a key and value`)
  const newKey = new DEFAULTS()
  newKey.uuid = id
  newKey.profileNum = profileNum
  newKey.key = key
  newKey.value = value ? encryption.encryptText(value) : value
  return config.db
    .prepare(
      `INSERT INTO ${TABLENAME} (${Object.keys(newKey)})
      VALUES (${Object.keys(newKey).fill('?')})
      ON CONFLICT(uuid, profileNum, key) DO UPDATE
      SET value = excluded.value
    `
    )
    .run(Object.values(newKey))
}

async function remove(id, profileNum, key) {
  if (!key) throw new Error(`${TABLENAME} remove requires a key`)
  const currentKey = await get(id, profileNum, key)
  if (!currentKey) throw new Error(`${key} doesn't exist`)
  return config.db
    .prepare(`DELETE FROM ${TABLENAME} WHERE (uuid, profileNum, key) is (?, ?, ?)`)
    .run(id, profileNum, key)
}

module.exports = { TABLE, DEFAULTS, get, getAll, add, remove }
