const Router = require('@koa/router')

const logger = require('../modules/logger')
// const config = require('../config/config')
const u = require('../utils/utils')
const nsdb = require('../models/nodeserver')
const nscore = require('../modules/nodeserver/core')
const isyInbound = require('../modules/isy/inbound')

/**
 * NS Interface Module
 * @module routes/nodeserver
 * @version 3.0
 */

/**
 Headers: Content-Type: application/json
 Body: {"username": "admin", "password": "admin"}
 Response: {"success": true, "token": "JWT TOKEN", "user": {"username": "e42"}}
 * @name authenticate
 * @route {POST} /auth
 */
const router = new Router({ prefix: '/ns' })

async function checkAuth(ctx, nodeServer) {
  const authB64 = ctx.headers.authorization.split(' ')[1]
  const authString = Buffer.from(authB64, 'base64').toString('utf8')
  if (!authString.includes(nodeServer.uuid)) ctx.throw(401)
  if (!authString.includes(nodeServer.token)) ctx.throw(401)
}

async function getNodeserver(ctx) {
  let uuid
  let profileNum
  const idArray = ctx.params.id.split('_')
  if (idArray.length === 2) {
    ;[uuid, profileNum] = idArray
    const nodeServer = await nsdb.get(uuid, profileNum)
    await checkAuth(ctx, nodeServer)
    return nodeServer
  }
  return ctx.throw(`Prefix not valid`)
}

/**
 * Not Implemented yet
 * @name install
 * @route {GET} rest/:id/install/:profileNum
 */
router.get('/:id/install/:profileNum', async ctx => {
  try {
    const ns = await getNodeserver(ctx)
    logger.info(`[${ns.uuid}(${ns.profileNum})] ISY HTTP Inbound: Received Install`)
    ctx.body = { success: true, uuid: ns.uuid, profileNum: ns.profileNum, ...ctx.params }
  } catch (err) {
    logger.error(`ISY Inbound Install: ${err.stack}`)
    ctx.status = 401
    ctx.body = { success: false, error: err.message, ...ctx.params }
  }
})

/**
 * base/nodes/nodeAddress/query[?requestId=requestId]
 * base/nodes/nodeAddress/status[?requestId=requestId]
 * nodeAddress of 0 means query all nodes
 * @name status
 * @route {GET} rest/id/nodes/nodeAddress/command
 */
router.get('/:id/nodes/:nodeAddress/:command', async ctx => {
  try {
    const ns = await getNodeserver(ctx)
    logger.info(`[${ns.uuid}(${ns.profileNum})] ISY HTTP Inbound: Received ${ctx.params.command}`)
    ctx.body = { success: true, uuid: ns.uuid, profileNum: ns.profileNum, ...ctx.params }
    const message = {
      address: ctx.params.nodeAddress === '0' ? 'all' : ctx.params.nodeAddress.slice(5)
    }
    nscore.sendMessage(ns.uuid, ns.profileNum, { [ctx.params.command]: message })
    if (u.isIn(ctx.query, 'requestId')) {
      isyInbound.request(ns.uuid, ns.profileNum, { ...ctx.query, success: true })
    }
  } catch (err) {
    logger.error(`ISY Inbound Status: ${err.stack}`)
    ctx.status = 401
    ctx.body = { success: false, error: err.message, ...ctx.params }
  }
})

/**
 * Not Implemented yet on nodeserver interfaces
 * base/add/nodes[?requestId=requestId]
 * @name addnodes
 * @route {GET} rest/id/add/nodes
 */
router.get('/:id/add/nodes', async ctx => {
  try {
    const ns = await getNodeserver(ctx)
    logger.info(`[${ns.uuid}(${ns.profileNum})] ISY HTTP Inbound: Received Add Nodes`)
    ctx.body = { success: true, uuid: ns.uuid, profileNum: ns.profileNum, ...ctx.params }
    if (u.isIn(ctx.query, 'requestId')) {
      isyInbound.request(ns.uuid, ns.profileNum, { ...ctx.query, success: true })
    }
  } catch (err) {
    logger.error(`ISY Inbound Status: ${err.stack}`)
    ctx.status = 401
    ctx.body = { success: false, error: err.message, ...ctx.params }
  }
})

// <base>/nodes/<nodeAddress>/report/remove
// <base>/nodes/<nodeAddress>/report/rename?name=<nodeName>
// <base>/nodes/<nodeAddress>/report/enable
// <base>/nodes/<nodeAddress>/report/disable
// <base>/nodes/<nodeAddress>/report/add/<nodeDefId>?primary=<nodeAddress>&name=<nodeName>
/**
 * Not implemented yet in ISY
 * base/id//nodes/report/command/nodeDefId/[?requestId=requestId]
 * @name report
 * @route {GET} base/id//nodes/report/command/nodeDefId/[?requestId=requestId]
 */
router.get('/:id/nodes/:nodeAddress/report/:command/:nodeDefId?', async ctx => {
  try {
    const ns = await getNodeserver(ctx)
    logger.info(`[${ns.uuid}(${ns.profileNum})] ISY HTTP Inbound: Received Report`)
    ctx.body = { success: true, uuid: ns.uuid, profileNum: ns.profileNum, ...ctx.params }
    if (u.isIn(ctx.query, 'requestId')) {
      isyInbound.request(ns.uuid, ns.profileNum, { ...ctx.query, success: true })
    }
  } catch (err) {
    logger.error(`ISY Inbound Status: ${err.stack}`)
    ctx.status = 401
    ctx.body = { success: false, error: err.message, ...ctx.params }
  }
})

// <base>/nodes/<nodeAddress>/cmd/<command>
// <base>/nodes/<nodeAddress>/cmd/<command>/<value>
// <base>/nodes/<nodeAddress>/cmd/<command>/<value>/<uom>
// [?<p1>.<uom1>=<val1>&<p2>...][requestId=<requestId>]
/**
 * rest/id/nodeAddress/cmd/command/value/uom
 * @name command
 * @route {GET} rest/id/nodeAddress/cmd/command/value/uom
 */
router.get('/:id/nodes/:nodeAddress/cmd/:command/:value?/:uom?', async ctx => {
  try {
    const ns = await getNodeserver(ctx)
    logger.info(
      `[${ns.uuid}(${ns.profileNum})] ISY HTTP Inbound: Received ${
        ctx.params.command
      } for node: ${ctx.params.nodeAddress.slice(5)}`
    )
    ctx.body = { success: true, uuid: ns.uuid, profileNum: ns.profileNum, ...ctx.params }
    const message = {
      address: ctx.params.nodeAddress.slice(5),
      cmd: ctx.params.command,
      value: ctx.params.value || undefined,
      uom: ctx.params.uom || undefined,
      query: ctx.query || undefined
    }
    nscore.sendMessage(ns.uuid, ns.profileNum, { command: message })
    if (u.isIn(ctx.query, 'requestId')) {
      isyInbound.request(ns.uuid, ns.profileNum, { ...ctx.query, success: true })
    }
  } catch (err) {
    logger.error(`ISY Inbound Status: ${err.stack}`)
    ctx.status = 401
    ctx.body = { success: false, error: err.message, ...ctx.params }
  }
})

module.exports = router
