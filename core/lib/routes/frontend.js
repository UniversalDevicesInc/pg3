/* eslint-disable
  no-use-before-define
 */

const Router = require('@koa/router')
const Stream = require('stream')
const fs = require('fs-extra')
// const Tail  = require('tail').Tail
const Archiver = require('archiver')
const unzipper = require('unzipper')
const crypto = require('crypto')
const axios = require('axios')
// const git = require('simple-git')

const logger = require('../modules/logger')
const config = require('../config/config')
const u = require('../utils/utils')
const nsdb = require('../models/nodeserver')
const db = require('../services/db')
const mqtts = require('../services/mqtts')
const mqttc = require('../services/mqttc')
const httpc = require('../services/httpc')
const nsservice = require('../services/nodeservers')
const isyns = require('../modules/isy/nodeserver')
const custom = require('../models/custom')

/**
 * Frontend Interface Module
 * @module routes/frontend
 * @version 3.0
 */


const router = new Router({ prefix: '/frontend' })

/**
* @name settings
* @route {GET} /frontend/settings
* @authentication JWT token
* @headerparam Content-Type: application/json
* @example <caption>Body</caption>
   None
* @example <caption>Response</caption>
{
  "isyHost":"10.0.0.14",
  "isyPort":"80",
  "isyUsername":"admin",
  "isyPassword":"admin",
  "isyHttps":"false",
  "mqttHost":"10.0.0.17",
  "mqttPort":"1883"
}
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
            await isyns.installNodeServer(ns)
            await nsservice.installNs(ns)
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
      // process.kill(process.pid, 'SIGINT')
    } else {
      throw new Error(`database not found... how did you get here?`)
    }
  } catch (err) {
    logger.error(`Backup: ${err.stack}`)
    ctx.body = { success: false, error: `${err.stack}` }
  }
})

router.post('/restoreFrom2', async ctx => {
  try {
    const { file } = ctx.request.files
    if (!u.isIn(ctx.query, 'uuid')) throw new Error(`UUID not provided`)
    const { uuid } = ctx.query
    logger.info(`Starting Restore of Version 2 data. File Name: ${file.name} to ${uuid}`)
    const directory = await unzipper.Open.file(file.path)
    const backupFile = directory.files.find(d => d.path === 'backup.bin')
    const decrypted = JSON.parse(decrypt2((await backupFile.buffer()).toString()))
    logger.info(`RESTORE: Backup decrypted, processing NodeServers for Restore...`)
    const options = {
      method: 'get',
      url: 'https://pg3store.isy.io/v1/list?all',
      timeout: 5000
    }
    const storeRes = await axios(options)
    if (storeRes.status !== 200) {
      throw new Error('Could not get nodeservers from pg3store')
    }
    const storeNodeServers = storeRes.data
    if (decrypted.nodeServers && decrypted.nodeServers.length > 0) {
      await Promise.allSettled(
        decrypted.nodeServers.map(async ns => {
          try {
            logger.info(`RESTORE: Attempting restore of ${ns.name} in slot ${ns.profileNum}`)
            let url
            storeNodeServers.map(storens => {
              if (storens.name === ns.name) url = storens.url
              return storens
            })
            if (!url) throw new Error(`NodeServer url not found in store. Skipping`)
            await nsdb.remove(uuid, ns.profileNum)
            const result = await nsservice.createNs(
              {
                uuid,
                name: ns.name,
                profileNum: ns.profileNum,
                url
              },
              true
            )
            if (u.isIn(ns, 'notices'))
              custom.set([uuid, ns.profileNum], 'set', { key: 'notices', value: ns.notices })
            if (u.isIn(ns, 'customData'))
              custom.set([uuid, ns.profileNum], 'set', { key: 'customdata', value: ns.customData })
            if (u.isIn(ns, 'customParams'))
              custom.set([uuid, ns.profileNum], 'set', {
                key: 'customparams',
                value: ns.customParams
              })
            if (u.isIn(ns, 'customParamsDoc'))
              custom.set([uuid, ns.profileNum], 'set', {
                key: 'customparamsdoc',
                value: ns.customParamsDoc
              })
            if (u.isIn(ns, 'typedParams'))
              custom.set([uuid, ns.profileNum], 'set', {
                key: 'customtypedparams',
                value: ns.typedParams
              })
            if (u.isIn(ns, 'typedCustomData'))
              custom.set([uuid, ns.profileNum], 'set', {
                key: 'customtypeddata',
                value: ns.typedCustomData
              })
            if (result.success) {
              const zip = fs.createReadStream(file.path).pipe(unzipper.Parse({ forceStream: true }))
              await Promise.allSettled(
                zip.map(async entry => {
                  if (entry.path.includes(`${ns.name}/`)) {
                    const pathName = entry.path.replace(`${ns.name}/`, '')
                    entry.pipe(
                      fs.createWriteStream(
                        `${process.env.PG3WORKDIR}ns/${uuid}_${ns.profileNum}/${pathName}`
                      )
                    )
                  }
                })
              )
            }
            ctx.body = { success: true }
            ctx.status = 200
            logger.warn(`Restore Completed. Shutting down in 5 seconds.`)
            await u.timeout(5000)
            // process.kill(process.pid, 'SIGINT')
          } catch (err) {
            logger.error(`Failed to restore nodeserver :: ${err.stack}`)
          }
        })
      )
    }
  } catch (err) {
    logger.error(`Backup: ${err.stack}`)
    ctx.body = { success: false, error: `${err.stack}` }
  }
})

function decrypt2(text) {
  const algorithm = 'aes-256-ctr'
  const key = 'b2df428b9929d3ace7c598bbf4e496b2'
  const encoding = ',2YE6=#r(z5?Y4=a'
  const inputEncoding = 'utf8'
  const outputEncoding = 'hex'
  const textParts = text.split(':')
  let decipher
  let dec
  if (textParts.length >= 2) {
    const iv = Buffer.from(textParts.shift(), outputEncoding)
    const encryptedText = Buffer.from(textParts.join(':'), outputEncoding)
    decipher = crypto.createDecipheriv(algorithm, key, iv)
    dec = decipher.update(encryptedText, outputEncoding, inputEncoding)
  } else {
    // eslint-disable-next-line
    decipher = crypto.createDecipher(algorithm, encoding)
    dec = decipher.update(text, outputEncoding, inputEncoding)
  }
  dec += decipher.final(inputEncoding)
  return dec.toString()
}

async function stopAll() {
  await nsservice.stop()
  await httpc.stop()
  await mqttc.stop()
  await mqtts.stop()
  await db.stop()
}

module.exports = router
