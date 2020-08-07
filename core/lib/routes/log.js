const Router = require('@koa/router')
const fs = require('fs-extra')

const logger = require('../modules/logger')
// const config = require('../config/config')
// const u = require('../utils/utils')
const ns = require('../models/nodeserver')

/**
 * Log Interface Module
 * @module routes/log
 * @version 3.0
 */

const router = new Router({ prefix: '/logs' })

router.get('/:type', async ctx => {
  const { type } = ctx.params
  let logFile = `${process.env.PG3WORKDIR}logs/pg3-current.log`
  let uuid
  let profileNum
  // Split /log/<uuid>_<profileNum> and validate
  try {
    const typePieces = type.split('_')
    if (typePieces.length === 2) {
      ;[uuid, profileNum] = typePieces
      const nodeServer = await ns.get(uuid, profileNum)
      if (nodeServer && nodeServer.type !== 'unmanaged') {
        logFile = `${nodeServer.home}/${nodeServer.log}`
      }
    }
    ctx.compress = true
    logger.debug(`Sending logfile to frontend :: ${logFile}`)
    const readStream = fs.createReadStream(logFile)
    // ctx.set('Content-Type', 'text/plain')
    ctx.body = readStream
    // ctx.status = 200
  } catch (err) {
    logger.error(`streamLog: ${err.stack}`)
  }
})

router.get('/download/:type', async ctx => {
  const { type } = ctx.params
  let logFile = `${process.env.PG3WORKDIR}logs/pg3-current.log`
  let uuid
  let profileNum
  let nodeServer
  // Split /log/<uuid>_<profileNum> and validate
  try {
    const typePieces = type.split('_')
    if (typePieces.length === 2) {
      ;[uuid, profileNum] = typePieces
      nodeServer = await ns.get(uuid, profileNum)
      if (nodeServer && nodeServer.type !== 'unmanaged') {
        logFile = `${nodeServer.home}/${nodeServer.log}`
      }
    }
    ctx.compress = true
    const tsFormat = () =>
      new Date()
        .toLocaleString()
        .replace(/, /g, '_')
        .replace(/\//g, '-')
        .replace(/ /g, '_')
        .replace(/:/g, '')
    ctx.set('access-control-expose-headers', 'content-disposition')
    ctx.set('content-type', 'application/octet-stream')
    ctx.set(
      'content-disposition',
      `attachment;filename=${nodeServer ? nodeServer.name : 'pg3'}_${tsFormat()}.txt`
    )
    logger.debug(`Downloading logfile :: ${logFile}`)
    const readStream = fs.createReadStream(logFile)
    ctx.body = readStream
    // ctx.status = 200
  } catch (err) {
    logger.error(`downloadLog: ${err.stack}`)
  }
})

module.exports = router
