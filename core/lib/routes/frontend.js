/* eslint-disable
  no-use-before-define
 */

const Router = require('@koa/router')
const Stream = require('stream')
const fs = require('fs-extra')
const { Tail } = require('tail')
const Archiver = require('archiver')
const unzipper = require('unzipper')

const logger = require('../modules/logger')
const config = require('../config/config')
const u = require('../utils/utils')
const nsdb = require('../models/nodeserver')
const db = require('../services/db')
const mqtts = require('../services/mqtts')
const mqttc = require('../services/mqttc')
const httpc = require('../services/httpc')
const nsservice = require('../services/nodeservers')

/**
 * Frontend Interface Module
 * @module routes/frontend
 * @version 3.0
 */

/**
 Headers: Content-Type: application/json
 Body: {"username": "admin", "password": "admin"}
 Response: {"success": true, "token": "JWT TOKEN", "user": {"username": "e42"}}
 * @name authenticate
 * @route {POST} /frontend/authenticate
 */
const router = new Router({ prefix: '/frontend' })

/**
Headers: Content-Type: application/json
Authorization: JWT token
Body: None
Response: {"isyHost":"10.0.0.14","isyPort":"80","isyUsername":"admin","isyPassword":"admin","isyHttps":"false","mqttHost":"10.0.0.17","mqttPort":"1883"}
* @name settings
* @route {GET} /frontend/settings
*/
router.get('/settings', ctx => {
  const settings = {
    global: config.globalsettings
  }
  ctx.response.body = settings
})

router.get('/ispolisy', ctx => {
  const ispolisy = {
    isPolisy: config.globalsettings.polisy
  }
  ctx.response.body = ispolisy
})

router.get('/logstream/:type', async ctx => {
  const {
    params: { type }
  } = ctx
  if (type === 'main') {
    ctx.response.set('content-type', 'text/plain;charset=UTF-8')
    // Stream Log File
  }
})

router.get('/backup', async ctx => {
  try {
    logger.info(`Starting Backup Creation`)
    const date = new Date()
      .toLocaleString()
      .replace(/, /g, '_')
      .replace(/\//g, '-')
      .replace(/ /g, '_')
      .replace(/:/g, '')
    const filename = `pg3-backup-${date}.zip`
    ctx.response.set('access-control-expose-headers', 'content-disposition')
    ctx.response.set('content-type', 'application/zip')
    ctx.response.set('content-disposition', `attachment;filename=${filename}`)
    logger.debug(`Creating DB Backup...`)
    const zip = Archiver('zip', { zlib: { level: 9 } })
    const stream = new Stream.PassThrough()
    ctx.body = stream
    zip.pipe(stream)
    const dbBackupFile = `backup.db`
    await config.db.backup(`${process.env.PG3WORKDIR}${dbBackupFile}`)
    logger.debug(`Creating DB Backup: Done`)
    logger.debug(`Getting all installed NodeServers`)
    const nodeServers = await nsdb.getAllInstalled()
    if (nodeServers && nodeServers.length > 0) {
      await Promise.allSettled(
        nodeServers.map(ns => {
          if (ns && u.isIn(ns, 'home')) {
            if (fs.existsSync(`${ns.home}/server.json`)) {
              const server = JSON.parse(fs.readFileSync(`${ns.home}/server.json`, 'utf8'))
              if (u.isIn(server, 'persist_folder')) {
                zip.directory(
                  `${ns.home}/${server.persist_folder}`,
                  `ns/${ns.uuid}_${ns.profileNum}/${server.persist_folder}`
                )
              } else {
                logger.debug(`No persist_folder found in server.json for ${ns.name}`)
              }
            } else {
              logger.debug(`No server.json found for ${ns.name}`)
            }
          }
          return ns
        })
      )
    }
    await zip.file(`${process.env.PG3WORKDIR}${dbBackupFile}`, { name: dbBackupFile }).finalize()
    logger.debug(`Removing Backup Archive from filesystem after download`)
    fs.removeSync(`${process.env.PG3WORKDIR}${dbBackupFile}`)
    logger.info(`Backup Successful`)
  } catch (err) {
    logger.error(`Backup: ${err.stack}`)
    ctx.body = { error: `${err.stack}` }
  }
})

router.post('/restore', async ctx => {
  try {
    const { file } = ctx.request.files
    logger.info(`Starting Restore. File Name: ${file.name}`)
    const directory = await unzipper.Open.file(file.path)
    const database = directory.files.find(d => d.path === 'backup.db')
    if (!database) throw new Error(`backup.db file not found in ${file.name}`)
    logger.debug(`Found database in backup. Restoring.`)
    if (fs.existsSync(`${process.env.PG3WORKDIR}pg3.db`)) {
      logger.warn(`Stopping All Services`)
      await stopAll()
      if (fs.existsSync(`${process.env.PG3WORKDIR}pg3_backup_before_restore.db`))
        fs.unlinkSync(`${process.env.PG3WORKDIR}pg3_backup_before_restore.db`)
      logger.debug(`Found existing db. Moving.`)
      fs.renameSync(
        `${process.env.PG3WORKDIR}pg3.db`,
        `${process.env.PG3WORKDIR}pg3_backup_before_restore.db`
      )
      logger.debug(`Copying database from backup`)
      await new Promise((resolve, reject) => {
        database
          .stream()
          .pipe(fs.createWriteStream(`${process.env.PG3WORKDIR}pg3.db`))
          .on('error', reject)
          .on('finish', resolve)
      })
      await db.start()
      const nodeServers = await nsdb.getAllInstalled()
      if (nodeServers && nodeServers.length > 0) {
        await Promise.allSettled(
          nodeServers.map(async ns => {
            const localDir = `${process.env.PG3WORKDIR}ns/${ns.uuid}_${ns.profileNum}`
            await nsservice.gitClone(ns.uuid, ns.profileNum, ns.url, localDir)
          })
        )
        logger.info(`RESTORE: Completed Database restore... Starting persistent file extraction.`)
        await directory.extract({ path: `${process.env.PG3WORKDIR}`, concurrency: 5 })
        fs.unlinkSync(`${process.env.PG3WORKDIR}backup.db`)
        logger.info(`RESTORE: Completed persistent file extraction.`)
      } else {
        logger.warn(`You restored with no installed NodeServers. Seems silly.`)
      }
      ctx.body = { success: true }
      logger.warn(`Restore Completed. Shutting down in 5 seconds.`)
      await u.timeout(5000)
      process.kill(process.pid, 'SIGINT')
    } else {
      throw new Error(`database not found... how did you get here?`)
    }
  } catch (err) {
    logger.error(`Backup: ${err.stack}`)
    ctx.body = { success: false, error: `${err.stack}` }
  }
})

async function stopAll() {
  await nsservice.stop()
  await httpc.stop()
  await mqttc.stop()
  await mqtts.stop()
  await db.stop()
}

module.exports = router
