const bcrypt = require('bcrypt')

const logger = require('../modules/logger')
const config = require('../config/config')

const encryption = require('../modules/security/encryption')
const discoverisy = require('../modules/isy/discover')

const secure = require('./secure')
const globalsettings = require('./globalsettings')
const user = require('./user')
const isy = require('./isy')
const ns = require('./nodeserver')
const node = require('./node')
const driver = require('./driver')

function checkForTable(table) {
  return config.db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' and name=(?);`)
    .get(table)
}

async function secureTable() {
  const table = 'secure'
  if (checkForTable(table)) {
    const entry = config.db.prepare(`SELECT * FROM ${table} WHERE (key) is 'pg3key'`).get()
    if (entry && entry.value) {
      config.pg3key = entry.value
      logger.info(`Encryption key found ID: ${entry.id}. Database version ${entry.dbVersion}`)
      return
    }
  } else {
    logger.warn(
      `Table ${table} doesn't exist. This is probably a first run or reset. Initializing table`
    )
    secure.TABLE.map(sql => config.db.exec(sql))
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
  logger.info(
    `Encryption key generated with ID: ${newKey.id}. Database version ${newKey.dbVersion}`
  )
}

async function settingsTable() {
  const table = 'globalsettings'
  if (checkForTable(table)) {
    logger.debug(`Table ${table} exists attempting to load`)
    config.globalsettings = await globalsettings.get()
    if (config.globalsettings) {
      logger.info(`Loaded ${table} successfully. Database version ${config[table].dbVersion}`)
      return
    }
  } else {
    logger.warn(
      `Table ${table} doesn't exist. This is probably a first run or reset. Initializing table`
    )
    globalsettings.TABLE.map(sql => config.db.exec(sql))
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

async function userTable() {
  const table = 'user'
  if (checkForTable(table)) {
    logger.debug(`Table ${table} exists attempting to load`)
    const adminUser = config.db.prepare(`SELECT * FROM ${table} WHERE (name) is 'admin'`).get()
    if (!adminUser) {
      logger.debug(`Table ${table} empty. Creating default ${table} entry`)
      await addDefaultUser()
    } else {
      logger.debug(
        `Verified default ${table} successfully. Database version ${adminUser.dbVersion}`
      )
      bcrypt.compare('admin', adminUser.hash).then(result => {
        if (result) logger.warn(`Default password for user admin still in use! Please change!`)
      })
    }
  } else {
    logger.warn(
      `Table ${table} doesn't exist. This is probably a first run or reset. Initializing table`
    )
    user.TABLE.map(sql => config.db.exec(sql))
    await addDefaultUser()
  }
}

async function isyTable() {
  const table = 'isy'
  if (checkForTable(table)) {
    logger.debug(`Table ${table} exists attempting to load`)
    config.isys = await isy.getAll()
    if (config.isys && config.isys.length > 0) {
      logger.info(`${table} table: Loaded (${config.isys.length}) successfully`)
      return
    }
  } else {
    logger.warn(
      `Table ${table} doesn't exist. This is probably a first run or reset. Initializing table`
    )
    isy.TABLE.map(sql => config.db.exec(sql))
  }
  logger.debug(`Table ${table} empty. Attempting auto-discovery`)
  const discoveredIsy = await discoverisy.find()
  if (discoveredIsy.discovered === 1) {
    const newEntry = new isy.DEFAULTS()
    newEntry.password = encryption.encryptText(newEntry.password)
    Object.assign(newEntry, discoveredIsy)
    config.db
      .prepare(
        `INSERT INTO ${table} (${Object.keys(newEntry)})
        VALUES (${Object.keys(newEntry).fill('?')})`
      )
      .run(Object.values(newEntry))
    config.isys = await isy.getAll()
    logger.info(
      `Discovered ISY Version ${newEntry.version} with ID: ${newEntry.uuid} at ${newEntry.ip}:${newEntry.port} successfully. Database version ${newEntry.dbVersion}`
    )
  }
  logger.info(`No ISY Discovered. Please add manually through the web interface`)
}

async function nodeserverTable() {
  const table = 'nodeserver'
  let nodeservers = null
  if (checkForTable(table)) {
    logger.debug(`Table ${table} exists attempting to load`)
    nodeservers = await ns.getAll()
  } else {
    logger.warn(
      `Table ${table} doesn't exist. This is probably a first run or reset. Initializing table`
    )
    ns.TABLE.map(sql => config.db.exec(sql))
  }
  if (nodeservers && nodeservers.length > 0)
    logger.info(`${table} table: Loaded ${nodeservers.length} nodeserver(s) successfully`)
  else logger.info(`No NodeServers in database. Add one through the user interface to get started`)
}

async function nodeTable() {
  const table = 'node'
  if (checkForTable(table)) {
    logger.debug(`Table ${table} exists`)
  } else {
    logger.warn(
      `Table ${table} doesn't exist. This is probably a first run or reset. Initializing table`
    )
    node.TABLE.map(sql => config.db.exec(sql))
  }
}

async function driverTable() {
  const table = 'driver'
  if (checkForTable(table)) {
    logger.debug(`Table ${table} exists`)
  } else {
    logger.warn(
      `Table ${table} doesn't exist. This is probably a first run or reset. Initializing table`
    )
    driver.TABLE.map(sql => config.db.exec(sql))
  }
}

module.exports = {
  secureTable,
  settingsTable,
  userTable,
  isyTable,
  nodeserverTable,
  nodeTable,
  driverTable
}
