const sqlite3 = require('better-sqlite3')

const logger = require('../modules/logger')
const config = require('../config/config')

const check = require('../models/checkdatabase')

/**
 * Database Module
 * @module modules/db
 * @version 3.0
 */

async function start() {
  if (!config.db) {
    logger.info(`Starting sqlite database at ${process.env.PG3WORKDIR}pg3.db`)
    config.db = sqlite3(`${process.env.PG3WORKDIR}pg3.db`, {
      verbose: logger.debug
    })
    await check.secureTable()
    await check.settingsTable()
    await check.userTable()
    await check.isyTable()
    await check.nodeserverTable()
    await check.nodeTable()
    await check.customTable()
    await check.driverTable()
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
