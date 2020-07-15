/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign
  */

const logger = require('../logger')
const isy = require('../../models/isy')

async function reboot(id, cmd, data) {
  console.log(id, cmd, data)
}

async function getIsys(id, cmd, data) {
  try {
    const results = await isy.getAll()
    results.map(item => {
      delete item.password
      return item
    })
    return results
  } catch (err) {
    logger.error(`getAllNs: ${err.stack}`)
  }
  return { error: 'Not found' }
}

const API = {
  reboot: {
    props: ['uuid', 'name', 'profileNum', 'url'],
    func: reboot
  },
  getIsys: {
    props: [],
    func: getIsys
  }
}

module.exports = { API }
