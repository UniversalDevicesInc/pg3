const sqlite3 = require('better-sqlite3')
const bcrypt = require('bcrypt')

const logger = require('../modules/logger')
const config = require('../config/config')
const encryption = require('../modules/encryption')

const secure = require('../models/secure')
const globalsettings = require('../models/globalsettings')
const user = require('../models/user')
const isy = require('../models/isy')

/**
 * Database Module
 * @module modules/db
 * @version 3.0
 */

function checkForTable(table) {
  return config.db.prepare(`SELECT name FROM sqlite_master WHERE type='table' and name=(?);`).get(table)
}

async function checkAndVerifySecure() {
  const table = 'secure'
  if (checkForTable(table)) {
    const entry = config.db.prepare(`SELECT * FROM ${table} WHERE (key) is 'pg3key'`).get()
    if (entry && entry.value) {
      config.pg3key = entry.value
      logger.info(`Encryption key found ID: ${entry.id}. Database version ${entry.dbVersion}`)
      return
    }
  } else {
    logger.warn(`Table ${table} doesn't exist. This is probably a first run or reset. Initializing table`)
    secure.table.map(sql => config.db.exec(sql))
  }
  logger.debug(`Encryption key not found. Generating`)
  config.pg3key = encryption.generateKey()
  const newKey = new secure.DEFAULTS()
  newKey.key = 'pg3key'
  newKey.value = config.pg3key
  config.db
    .prepare(
      `INSERT INTO secure (${Object.keys(newKey)})
    VALUES (${Object.keys(newKey).fill('?')})`
    )
    .run(Object.values(newKey))
  logger.info(`Encryption key generated with ID: ${newKey.id}. Database version ${newKey.dbVersion}`)
}

async function checkAndVerifySettings() {
  const table = 'globalsettings'
  if (checkForTable(table)) {
    logger.debug(`Table ${table} exists attempting to load`)
    config.globalsettings = await globalsettings.get()
    if (config.globalsettings) {
      logger.info(`Loaded ${table} successfully. Database version ${config[table].dbVersion}`)
      return
    }
  } else {
    logger.warn(`Table ${table} doesn't exist. This is probably a first run or reset. Initializing table`)
    globalsettings.table.map(sql => config.db.exec(sql))
  }
  logger.debug(`Table ${table} empty. Creating default ${table} entry`)
  const newEntry = new globalsettings.DEFAULTS()
  config.db
    .prepare(
      `INSERT INTO ${table} (${Object.keys(newEntry)})
      VALUES (${Object.keys(newEntry).fill('?')})`
    )
    .run(Object.values(newEntry))
  config[table] = newEntry
  logger.info(`Loaded ${table} successfully. Database version ${newEntry.dbVersion}`)
}

async function addDefaultUser() {
  const newUser = new user.DEFAULTS()
  const hash = await bcrypt.hash('admin', 10)
  Object.assign(newUser, {
    name: 'admin',
    hash
  })
  config.db
    .prepare(
      `INSERT INTO user (${Object.keys(newUser)})
      VALUES (${Object.keys(newUser).fill('?')})`
    )
    .run(Object.values(newUser))
}

async function checkAndVerifyUser() {
  const table = 'user'
  if (checkForTable(table)) {
    logger.debug(`Table ${table} exists attempting to load`)
    const adminUser = config.db.prepare(`SELECT * FROM ${table} WHERE (name) is 'admin'`).get()
    if (!adminUser) {
      logger.debug(`Table ${table} empty. Creating default ${table} entry`)
      await addDefaultUser()
    } else {
      logger.debug(`Verified default ${table} successfully. Database version ${adminUser.dbVersion}`)
      bcrypt.compare('admin', adminUser.hash).then(result => {
        if (result) logger.warn(`Default password for user admin still in use! Please change!`)
      })
    }
  } else {
    logger.warn(`Table ${table} doesn't exist. This is probably a first run or reset. Initializing table`)
    user.table.map(sql => config.db.exec(sql))
    await addDefaultUser()
  }
}

async function start() {
  if (!config.db) {
    logger.info(`Starting sqlite database at ${process.env.PG3WORKDIR}pg3.db`)
    config.db = sqlite3(`${process.env.PG3WORKDIR}pg3.db`, {
      verbose: logger.debug
    })
    await checkAndVerifySecure()
    await checkAndVerifySettings()
    await checkAndVerifyUser()

    // Tests API for secure
    // await secure.add('test', '123')
    // await secure.update('test', 456)
    // logger.debug(`!!!! ${JSON.stringify(await secure.get('test'))}`)
    // await secure.remove('test')

    // Test API for globalsettings
    // await globalsettings.update('ssl', 0)

    // Tests API for user
    // await user.add('bob', 'test123')
    // await user.update('bob', { password: 'test333', enabled: false })
    // logger.debug(`!!!! ${JSON.stringify(await user.get('bob'))}`)
    // logger.debug(`!!!! ${await user.checkPassword('bob', 'test333')}`)
    // await user.remove('bob')
  }
}

async function stop() {
  if (config.db && config.db.open) {
    config.db.close()
  }
}

// API
module.exports = { start, stop }
