const { v4: uuid } = require('uuid')
const ip = require('ip')
var address = require('address')

const config = require('../config/config')
const u = require('../utils/utils')

/**
 * Global Settings Model
 * @module models/globalsettings
 * @version 3.0
 */
const TABLENAME = 'globalsettings'

// Returns array that is executed in order for Schema updates
const TABLE = []
// pragma user_version = 1
TABLE[0] = `
  CREATE TABLE IF NOT EXISTS "${TABLENAME}" (
    id BLOB PRIMARY KEY UNIQUE,
    name TEXT NOT NULL UNIQUE,
    pg3Version TEXT,
    mqttHost TEXT,
    mqttPort INTEGER,
    ipAddress TEXT,
    bindIpAddress TEXT,
    listenPort INTEGER,
    macAddress TEXT,
    secure INTEGER NOT NULL CHECK (secure IN (0,1)),
    store TEXT,
    customCerts INTEGER NOT NULL CHECK (customCerts IN (0,1)),
    beta INTEGER NOT NULL CHECK (beta IN (0,1)),
    timeStarted INTEGER,
    secret TEXT,
    polisy INTEGER NOT NULL CHECK (polisy IN (0,1)),
    timeAdded INTEGER NOT NULL,
    timeModified INTEGER,
    dbVersion INTEGER
  )
`
class DEFAULTS {
  constructor() {
    this.id = uuid()
    this.name = 'pg3'
    this.pg3Version = require('../../package.json').version
    this.mqttHost = process.env.PG3MQTTHOST || 'localhost'
    this.mqttPort = process.env.PG3MQTTPORT || 1883
    this.ipAddress = process.env.PG3IP || ip.address() || '127.0.0.1'
    this.bindIpAddress = process.env.PG3BINDIP || '0.0.0.0'
    this.listenPort = process.env.PG3LISTENPORT || process.env.POLISY ? 443 : 3000
    this.secure = 1
    this.store = 'https://pgcstore.isy.io/'
    this.customCerts = 0
    this.beta = 0
    this.polisy = process.env.POLISY ? 1 : 0
    this.timeStarted = Date.now()
    this.timeAdded = Date.now()
    this.dbVersion = TABLE.length
    this.macAddress = address.interface('IPv4').mac
  }
}

const MUTABLE = [
  'mqttHost',
  'mqttPort',
  'ipAddress',
  'listenPort',
  'macAddress',
  'store',
  'secure',
  'customCerts',
  'beta',
  'polisy',
  'timeStarted'
]

async function get() {
  return config.db.prepare(`SELECT * FROM ${TABLENAME} WHERE (name) is (?)`).get('pg3')
}

async function update(updateObject) {
  if (!updateObject || !typeof updateObject === 'object')
    throw new Error(`update${TABLENAME} parameters not valid`)
  let updated = ``
  MUTABLE.forEach(item => {
    if (u.isIn(updateObject, item)) {
      if (typeof updateObject[item] === 'boolean')
        updated += `${item} = '${updateObject[item] ? 1 : 0}',`
      else updated += `${item} = '${updateObject[item]}',`
    }
  })
  if (!updated.length > 0) throw new Error(`${TABLENAME} nothing to update`)
  updated += `timeModified = ${Date.now()}`
  return config.db
    .prepare(
      `UPDATE ${TABLENAME} SET
    ${updated}
    WHERE (name) is (?)`
    )
    .run('pg3')
}

async function updateVersion() {
  const { version } = require('../../package.json')
  return config.db
    .prepare(`UPDATE ${TABLENAME} SET pg3Version = '${version}' WHERE (name) is (?)`)
    .run('pg3')
}

async function TEST() {
  // Test API for globalsettings
  await update({ ssl: config.ssl })
  return true
}

module.exports = { TABLE, DEFAULTS, TEST, get, update, updateVersion }
