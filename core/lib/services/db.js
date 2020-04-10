const sqlite3 = require('better-sqlite3')
const bcrypt = require('bcrypt')

const logger = require('../modules/logger')
const config = require('../config/config')
const encryption = require('../modules/security/encryption')

const secure = require('../models/secure')
const globalsettings = require('../models/globalsettings')
const user = require('../models/user')
const isy = require('../models/isy')
const discoverisy = require('../modules/isy/discover')
const ns = require('../models/nodeserver')
const node = require('../models/node')
const driver = require('../models/driver')

/**
 * Database Module
 * @module modules/db
 * @version 3.0
 */

function checkForTable(table) {
  return config.db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' and name=(?);`)
    .get(table)
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

async function checkAndVerifyUser() {
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

async function checkAndVerifyIsy() {
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
    isy.TABLE.Objectmap(sql => config.db.exec(sql))
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
  } else {
    logger.info(`No ISY Discovered. Please add manually through the web interface`)
  }
}

async function checkAndVerifyNodeServer() {
  const table = 'nodeserver'
  if (checkForTable(table)) {
    logger.debug(`Table ${table} exists attempting to load`)
    config.nodeservers = await isy.getAll()
  } else {
    logger.warn(
      `Table ${table} doesn't exist. This is probably a first run or reset. Initializing table`
    )
    ns.TABLE.map(sql => config.db.exec(sql))
  }
  if (config.nodeservers && config.nodeservers.length > 0) {
    logger.info(`${table} table: Loaded (${config.nodeservers.length}) nodeservers successfully`)
    return
  }
  logger.info(`No NodeServers in database. Add one through the user interface to get started`)
}

async function checkAndVerifyNode() {
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

async function checkAndVerifyDriver() {
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

async function start() {
  if (!config.db) {
    logger.info(`Starting sqlite database at ${process.env.PG3WORKDIR}pg3.db`)
    config.db = sqlite3(`${process.env.PG3WORKDIR}pg3.db`, {
      verbose: logger.debug
    })
    await checkAndVerifySecure()
    await checkAndVerifySettings()
    await checkAndVerifyUser()
    await checkAndVerifyIsy()
    await checkAndVerifyNodeServer()
    await checkAndVerifyNode()
    await checkAndVerifyDriver()

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

    // Tests API for ISY
    // await isy.add({ uuid: 'abc123', ip: '123' })
    // await isy.update('abc123', { uuid: 'abc124', port: 443, password: 'myman' })
    // console.log(await isy.get('abc124'))
    // await isy.remove('abc124')

    // Test API for nodeserver
    // await ns.add({
    //   uuid: '00:21:b9:02:45:1b',
    //   name: 'test',
    //   profileNum: 25,
    //   version: '1.2',
    //   home: '~/.pg3/ns/test',
    //   type: 'node',
    //   executable: 'main.js'
    // })
    // await ns.update('00:21:b9:02:45:1b', 25, { name: 'dumb', enabled: true })
    // console.log(await ns.get('00:21:b9:02:45:1b', 25))
    // await ns.remove('00:21:b9:02:45:1b', 25)

    // Test API for node
    // await node.add({
    //   uuid: '00:21:b9:02:45:1b',
    //   profileNum: 25,
    //   address: 'yourmom',
    //   nodeDefId: 'abc123'
    // })
    // await node.update('00:21:b9:02:45:1b', 25, 'yourmom', { nodeDefId: 'abc124' })
    // console.log(await node.get('00:21:b9:02:45:1b', 25, 'yourmom'))

    // Test API for driver
    // await driver.add({
    //   uuid: '00:21:b9:02:45:1b',
    //   profileNum: 25,
    //   address: 'yourmom',
    //   driver: 'ST',
    //   value: 123,
    //   uom: 48
    // })
    // await driver.update('00:21:b9:02:45:1b', 25, 'yourmom', 'ST', { value: 223 })
    // await driver.set('00:21:b9:02:45:1b', 25, 'yourmom', 'ST', 224, 33)
    // console.log(await driver.get('00:21:b9:02:45:1b', 25, 'yourmom', 'ST'))

    // Delete Nodeserver which should delete all nodes and drivers associated
    // await ns.remove('00:21:b9:02:45:1b', 25)
  }
}

async function stop() {
  logger.info(`DB Stopping Gracefully`)
  if (config.db && config.db.open) {
    config.db.close()
  }
}

// API
module.exports = { start, stop }
