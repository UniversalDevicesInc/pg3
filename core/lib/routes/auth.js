const Router = require('@koa/router')
const jwt = require('jsonwebtoken')

const logger = require('../modules/logger')
const config = require('../config/config')
const User = require('../models/user')

/**
 * Auth Interface Module
 * @module routes/auth
 * @version 3.0
 */

/**
 Headers: Content-Type: application/json
 Body: {"username": "admin", "password": "admin"}
 Response: {"success": true, "token": "JWT TOKEN", "user": {"username": "e42"}}
 * @name authenticate
 * @route {POST} /auth
 */
const router = new Router()

router.post('/auth', async ctx => {
  const { username, password } = ctx.request.body
  let gotUser
  try {
    gotUser = await User.get(username)
    if (!gotUser) {
      ctx.status = 401
      ctx.response.body = `No user`
      return
    }
    if (!gotUser.enabled) {
      ctx.status = 401
      ctx.response.body = `User Disabled`
      return
    }
    if (!(await User.checkPassword(username, password))) {
      ctx.status = 401
      ctx.response.body = `Bad username or password`
      return
    }
    ctx.status = 200
    logger.info(`Successful login by ${gotUser.name}`)
    // Sign's the JWT with the UUID of this instance of PG3
    const token = jwt.sign({ data: gotUser }, config.globalsettings.id, {
      expiresIn: 604800 // 1 week
    })
    ctx.response.body = {
      success: true,
      token: `${token}`,
      user: {
        id: gotUser.id,
        name: gotUser.name,
        role: gotUser.role,
        groups: gotUser.groups
      },
      settings: config.globalsettings
    }
  } catch (err) {
    logger.error(`Invalid user: ${err}`)
  }
})

router.get('/profile', async ctx => {
  const profile = {
    user: ctx.state.user.data,
    polisy: config.globalsettings.polisy
  }
  ctx.body = profile
})

module.exports = router
