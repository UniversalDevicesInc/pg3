const { v4: uuid } = require('uuid')
const ip = require('ip')

const config = require('../config/config')

/**
 * Global Settings Model
 * @module models/globalsettings
 * @version 3.0
 */
// Returns array that is executed in order for Schema updates
const TABLE = []
// pragma user_version = 1
TABLE[0] = `
  CREATE TABLE IF NOT EXISTS "globalsettings" (
    id BLOB PRIMARY KEY UNIQUE,
    name TEXT NOT NULL UNIQUE,
    pg3Version TEXT,
    mqttHost TEXT,
    mqttPort INTEGER,
    ipAddress TEXT,
    bindIpAddress TEXT,
    listenPort INTEGER,
    secure INTEGER NOT NULL CHECK (secure IN (0,1)),
    customCerts INTEGER NOT NULL CHECK (customCerts IN (0,1)),
    beta INTEGER NOT NULL CHECK (beta IN (0,1)),
    timeStarted INTEGER,
    secret TEXT,
    polisy INTEGER NOT NULL CHECK (polisy IN (0,1)),
    dbVersion INTEGER
  )
`
class DEFAULTS {
  constructor() {
    this.id = uuid()
    this.name = 'pg3'
    this.pg3Version = process.env.npm_package_version
    this.mqttHost = process.env.PG3MQTTHOST || 'localhost'
    this.mqttPort = process.env.PG3MQTTPORT || 1883
    this.ipAddress = process.env.PG3IP || ip.address() || '127.0.0.1'
    this.bindIpAddress = process.env.PG3BINDIP || '0.0.0.0'
    this.listenPort = process.env.PG3LISTENPORT || process.env.POLISY ? 443 : 3000
    this.secure = 1
    this.customCerts = 0
    this.beta = 0
    this.polisy = process.env.POLISY ? 1 : 0
    this.timeStarted = Date.now()
    this.dbVersion = TABLE.length
  }
}

const mutableKeys = [
  'mqttHost',
  'mqttPort',
  'ipAddress',
  'listenPort',
  'secure',
  'customCerts',
  'beta',
  'polisy',
  'timeStarted'
]

async function get() {
  return config.db.prepare(`SELECT * FROM globalsettings WHERE (name) is (?)`).get('pg3')
}

async function update(key, value) {
  if (!key) throw new Error(`globalsettings requires a key`)
  if (!mutableKeys.includes(key)) throw new Error(`${key} is not a valid configurable key`)
  return config.db
    .prepare(`UPDATE globalsettings SET ${key} = (?) WHERE (name) is 'pg3'`)
    .run(value)
}

module.exports = { TABLE, DEFAULTS, get, update }
