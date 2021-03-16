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
 * @name authenticate
 * @route {POST} /auth
 * @headerparam Content-Type: application/json
 * @example <caption>Body</caption>
 * {
 *  "username": "admin", 
 *  "password": "admin"
 * }
 * @example <caption>Response</caption>
 * {
 *  "success": true,
 *  "token": "JWT TOKEN", 
 *  "user": {"username": "e42"}
 * }
 */
const router = new Router()

router.post('/transaction', async ctx => {
  const { queryby, user } = ctx.request.body
  let gotUser
  try {
    ctx.status = 200
    logger.info(`Looking up order transactions for ${user}`)

    ctx.response.body = [
	    {
		    order_id: 12345,
		    order_status: 'completed',
		    timestamp: 111111111,
		    items: [
			    {id:104754,name:'Node server',total:10},
			    {poli_id:'1a6e3b63-663e-4413-8fd3-59e55faf428c',name:'Node server',total:10},
			    {poli_id:'1a6e3b63-663e-4413-8fd3-59e55faf428c',name:'WeatherFlow',total:10},
		    ],
		    registered_polisy: [{product_id: 1234}]
	    } ]
  } catch (err) {
    logger.error(`Invalid user: ${err}`)
  }
})

router.get('/transaction', async ctx => {
    const transactions = {
	    transactions: [
		    {
			    order_id: 12345,
			    order_status: 'complete',
		    items: [ {id:104754,name:'Node server',total:10}],
		    registered_polisy: [{product_id: 1234}]
	    } ],
	    success: true,
    }

    ctx.body = transactions
})
module.exports = router
