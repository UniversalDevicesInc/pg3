/**
 * Polyglot Version 3 (PG3)
 * Written by James Milne(milne.james@gmail.com)
 */
const fs = require('fs')
const os = require('os')

const config = require('../lib/config/config')
// const utils = require('../lib/utils/utils')

// Get or Set PG3WORKDIR environment variable
let workDir = `${os.homedir()}/.pg3/`
if ('PG3WORKDIR' in process.env) {
  workDir = process.env.PG3WORKDIR
  if (!workDir.endsWith('/')) {
    workDir += '/'
  }
} else {
  process.env.PG3WORKDIR = workDir
}

const logger = require('../lib/modules/logger')
// These must be loaded after logger (they import logger, and logger needs workDir on first run)
const db = require('../lib/services/db')
const mqtts = require('../lib/services/mqtts')
const mqttc = require('../lib/services/mqttc')

const environment = require('../lib/modules/environment')
const certificates = require('../lib/modules/certificates')

logger.info(`Starting PG3 version ${process.env.npm_package_version}`)
logger.info(`Using Workdir ${process.env.PG3WORKDIR}`)

if (fs.existsSync(`${workDir}.env`)) {
  require('dotenv').config({ path: `${workDir}`.env })
}

/* Create Pid file */
async function createPid(force = true) {
  try {
    config.pidFile = `${process.env.PG3WORKDIR}pg3.pid`
    const pid = Buffer.from(`${process.pid}\n`)
    const fd = fs.openSync(config.pidFile, force ? 'w' : 'wx')
    let offset = 0

    while (offset < pid.length) {
      offset += fs.writeSync(fd, pid, offset, pid.length - offset)
    }
    fs.closeSync(fd)
    logger.debug(`Created PID file: ${config.pidFile}`)
  } catch (err) {
    if (err.code === 'EEXIST' || err.code === 'EACCES') {
      logger.error(`PID file already exists or is un-writable: ${config.pidFile} Exiting...`)
    } else {
      logger.error(`PID not created: ${err} exiting...`)
    }
    process.kill(process.pid, 'SIGINT')
  }
}

/* Remove Pid file */
async function removePid() {
  try {
    fs.unlinkSync(config.pidFile)
    logger.debug(`Removed PID file: ${config.pidFile}`)
  } catch (err) {
    logger.error(`PID file not removed: ${config.pidFile}`)
  }
}

/* Save NodeServers */
// async function saveNodeServers() {
//   await Promise.all(
//     config.nodeServers.map((ns) => {
//       if (ns.type !== 'unmanaged') {
//         logger.debug(`Saving NodeServer ${ns.name} to database.`)
//         ns.save()
//       }
//     })
//   )
// }

/* Kill all Children */
// async function killChildren() {
//   await Promise.all(
//     Object.values(config.nodeServers).map(async (ns) => {
//       if (ns.type === 'local') {
//         await nodeserver.stop(ns.profileNum)
//       }
//     })
//   )
//   logger.debug(`All NodeServers stopped.`)
// }

/* Initial Startup */
async function start() {
  try {
    await createPid()
    await db.start()
    await environment.start()
    await certificates.start()
    await mqtts.start()
    await mqttc.start()
  } catch (err) {
    logger.error(`Startup error. Shutting down: ${err.stack} `)
    process.exit(1)
  }
}

/* Shutdown */
async function shutdown() {
  config.shutdown = true
  await mqttc.stop()
  await mqtts.stop()
  await db.stop()
  await removePid()
  process.exit(0)
}

/* Gracefully shutdown when SIGTERM/SIGINT is caught */
function gracefulShutdown() {
  if (!config.shutdown) {
    config.shutdown = true
    logger.info('Caught SIGTERM/SIGINT Shutting down.')
    shutdown()
    // If processes fail to shut down, force exit after 3 seconds
    setTimeout(() => {
      process.exit(0)
    }, 3 * 1000)
  }
}

/* Catch SIGINT/SIGTERM and exit gracefully */
process.on('SIGINT', gracefulShutdown)

process.on('SIGTERM', gracefulShutdown)

process.once('exit', code => {
  logger.info(`PG3 shutdown complete with code: ${code}`)
})

process.on('uncaughtException', err => {
  logger.error(`uncaughtException REPORT THIS!: ${err.stack}`)
  gracefulShutdown()
})

process.on('unhandledRejection', err => {
  logger.error(`unhandledRejection REPORT THIS!: ${err.stack}`)
  // gracefulShutdown()
})

start()
