/* eslint callback-return: "off",
  func-names: ["error", "always", { "generators": "never" }]
 */
const Koa = require('koa')
const cors = require('@koa/cors')
const compress = require('koa-compress')
const serve = require('koa-static')
const send = require('koa-send')
const bodyParser = require('koa-body')
const jwt = require('koa-jwt')

// const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')
const ws = require('websocket-stream')

// routes

const logger = require('../modules/logger')
const config = require('../config/config')
// const utils = require('../utils/utils')
// const encryption = require('../modules/security/encryption')
// const ns = require('../models/nodeserver')
const authRoutes = require('../routes/auth')
const frontendRoutes = require('../routes/frontend')
const logRoutes = require('../routes/log')
const nsRoutes = require('../routes/nodeserver')

/**
 * HTTP Server Start Service.
 * @method
 * @param {function} callback - Callback when connected or if already started.
 */
async function start() {
  if (!config.httpServer) {
    const app = new Koa()
    const port = config.globalsettings.listenPort
    const ip = config.globalsettings.bindIpAddress
    // Compression to gzip
    app.use(compress())
    // CORS Middleware
    app.use(cors())
    // Set Static Folder
    const staticFolder = path.join(__dirname, '../../public/')
    app.use(serve(staticFolder))
    // Body Parser
    app.use(bodyParser({ multipart: true }))
    // Error Handling
    app.use(async (ctx, next) => {
      try {
        await next()
      } catch (err) {
        if (err.status === 401) {
          ctx.status = 401
          ctx.body = {
            error: err.originalError ? err.originalError.message : err.message
          }
        } else {
          ctx.status = err.status || 500
          ctx.body = err.message
        }
        ctx.app.emit('error', err, ctx)
      }
    })
    app.use(
      jwt({
        secret: config.globalsettings.id
      }).unless({
        path: [
          /^\/auth/,
          '/',
          /^\/frontend\/ispolisy/,
          /^\/ns/,
          /^\/getns/,
          /^\/dashboard/,
          /^\/nsdetails/,
          /^\/settings/,
          /^\/log/
        ]
      })
    )
    // app.ws.use(async (ctx, next) => {
    //   return next(ctx)
    // })
    app.use(authRoutes.routes())
    app.use(authRoutes.allowedMethods())
    app.use(frontendRoutes.routes())
    app.use(frontendRoutes.allowedMethods())
    app.use(logRoutes.routes())
    app.use(logRoutes.allowedMethods())
    app.use(nsRoutes.routes())
    app.use(nsRoutes.allowedMethods())
    app.use(async ctx => {
      await send(ctx, `./public/index.html`)
    })

    try {
      if (config.globalsettings.secure) {
        let sslOptions = {}
        if (config.globalsettings.customCerts) {
          sslOptions = {
            key: config.customSslData.key,
            cert: config.customSslData.cert,
            ca: config.customSslData.ca,
            rejectUnauthorized: true,
            requestCert: false
          }
        } else {
          sslOptions = {
            key: config.sslData.private,
            cert: config.sslData.cert,
            rejectUnauthorized: false,
            requestCert: false
          }
        }
        config.httpServer = https.createServer(sslOptions, app.callback())
      } else {
        config.httpServer = http.createServer(app.callback())
      }
      ws.createServer({ server: config.httpServer, perMessageDeflate: false }, config.aedes.handle)

      // Start Server
      config.httpServer.listen(port, ip, () => {
        logger.info(
          `Koa ${
            config.globalsettings.secure ? 'HTTPS' : 'HTTP'
          } Interface Service: Started - Address: ${ip} Port: ${config.httpServer.address().port}`
        )
      })
    } catch (err) {
      return logger.error(`HTTP Server Startup Error: ${err}`)
    }
  }
  return new Error(`HTTP Server Already Running`)
}

/**
 * HTTP Server Stop Service
 * @method
 */
async function stop() {
  logger.info('Koa HTTP Service: Stopping')
  if (config.httpServer) {
    await config.httpServer.close()
    config.httpServer = null
  }
}

// API
module.exports = { start, stop }
