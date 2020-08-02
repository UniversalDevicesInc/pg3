/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign
  */
const convert = require('xml2js')

// const config = require('../../config/config')
const logger = require('../logger')
const u = require('../../utils/utils')

const isy = require('../isy/core')
const isySystem = require('../isy/system')
const isyNodeServer = require('../isy/nodeserver')
const isyErrors = require('../isy/errors')
const nodeservice = require('../../services/nodeservers')
const node = require('../../models/node')
const driver = require('../../models/driver')
const status = require('./status')

async function checkResponse(cmd, response) {
  let reason = null
  if (response.status !== 200) {
    try {
      const opts = {
        trim: true,
        async: true,
        mergeAttrs: true,
        explicitArray: false
      }
      reason = await convert.parseStringPromise(response.data, opts).RestResponse.reason.code
      throw new Error(
        `${cmd} failed: ISY returned error: (${reason}) ${isyErrors.ERRORS[reason] || ''}`
      )
    } catch (err) {
      throw new Error(`${cmd} failed: ISY returned status code ${response.status}`)
    }
  }
}

async function addnode([uuid, profileNum], cmd, data) {
  try {
    if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
    if (data.length <= 0) throw new Error(`${cmd} has no entries.`)
  } catch (err) {
    logger.error(`${cmd} :: ${err.stack}`)
    return { error: `${err.message}` }
  }
  return Promise.all(
    Object.values(data).map(async item => {
      let response = {}
      let existsInDb = false
      let existsOnIsy = false
      let update = false
      let addDrivers = true
      let existing = {}
      try {
        const props = u.verifyProps(item, ['address', 'primaryNode'])
        if (!props.valid)
          throw new Error(
            `Request missing required property: ${props.missing} :: ${JSON.stringify(item)}`
          )

        if (typeof item !== 'object') throw new Error(`${cmd} object invalid`)
        if (!u.hasProps(item, API[cmd].props))
          throw new Error(`${cmd} object does not have the correct properties`)
        if (!Array.isArray(item.drivers)) throw new Error(`${cmd} drivers must be an array`)
        existing = await status.getDrivers(uuid, profileNum, {
          address: item.address
        })
        if (existing.drivers) {
          existsOnIsy = true
          // returns false if drivers are the same
          addDrivers = await compareDrivers(uuid, profileNum, item)
          existsInDb = await node.get(uuid, profileNum, item.address)
          if (existsInDb) {
            // checks and updates nodeDefId(with NLS) and hint
            update = await checkNodeDefAndHint(uuid, profileNum, item, existsInDb)
          }
          if (!update && !addDrivers)
            logger.warn(
              `node ${item.address} on profile ${profileNum} already exists, no nodeDef or driver changes detected`
            )
        }
        if (existing.code && existing.code !== 404)
          throw new Error(`ISY returned error code: ${existing.code}`)
        if (!existsInDb) {
          logger.warn(
            `node ${item.address} on profile ${uuid}/${profileNum} exists on the ISY but not in the database. Adding...`
          )
          await node.add({
            uuid,
            profileNum,
            ...item
          })
        }
        if (!existsOnIsy) {
          const path = ['nodes', isy.addNodePrefix(profileNum, item.address), 'add', item.nodeDefId]
          response = await isy.isyGet(
            uuid,
            'command',
            isy.makeNodeUrl(uuid, profileNum, path, {
              primary: isy.addNodePrefix(profileNum, item.primaryNode),
              name: item.name || item.address,
              ...(item.nls ? { nls: item.nls } : {})
            }),
            profileNum,
            false // retry?
          )
          checkResponse(cmd, response)
          if (u.isIn(item, 'hint')) item.hint = u.convertHint(item.hint)
          logger.info(`[${uuid}_${profileNum}] ${cmd} sucessfully added node ${item.address}`)
          await isyNodeServer.setHint(uuid, profileNum, item)
          await isySystem.groupNodes(uuid, profileNum, item.address, item.primaryNode)
        }
        await nodeservice.sendFrontendUpdate()
        if (addDrivers) {
          // add drivers to the db and set in ISY
          await Promise.all(
            item.drivers.map(dvr =>
              driver
                .add({
                  uuid,
                  profileNum,
                  address: item.address,
                  ...dvr
                })
                .then(status.setDriver(uuid, profileNum, { ...dvr, address: item.address }, true))
                .catch(err => logger.error(`${cmd} add driver error: ${err.message}`))
            )
          )
        } else {
          item.drivers.map(dvr =>
            status.setDriver(uuid, profileNum, { ...dvr, address: item.address })
          )
        }
        return (await node.get(uuid, profileNum, item.address)) || {}
      } catch (err) {
        logger.error(`command ${cmd} ${err.stack}`)
        return {
          address: item.address,
          error: err.message,
          ...(response.status || existing.code ? { code: response.status || existing.code } : {})
        }
      }
    })
  )
}

async function removenode([uuid, profileNum], cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  if (data.length <= 0) throw new Error(`${cmd} has no entries.`)
  return Promise.all(
    Object.values(data).map(async item => {
      const result = {
        address: item.address
      }
      try {
        if (typeof item !== 'object') throw new Error(`driver object invalid`)
        if (!u.hasProps(item, API[cmd].props))
          throw new Error(`${cmd} object does not have the correct properties`)
        const path = ['nodes', isy.addNodePrefix(profileNum, item.address), 'remove']
        const response = await isy.isyGet(
          uuid,
          'command',
          isy.makeNodeUrl(uuid, profileNum, path),
          profileNum,
          false // retry?
        )
        if (![200, 404].includes(response.status)) await checkResponse(cmd, response)
        logger.info(`[${uuid}_${profileNum}] ${cmd} sucessfully removed node ${item.address}`)
        await node.remove(uuid, profileNum, item.address)
        await nodeservice.sendFrontendUpdate()
        return { ...result, success: true }
      } catch (err) {
        logger.error(`command ${cmd} ${err.message}`)
        return { ...result, success: false, error: err.message }
      }
    })
  )
}

async function compareDrivers(uuid, profileNum, newNode) {
  const existingDrivers = await driver.getAllNode(uuid, profileNum, newNode.address)
  if (!existingDrivers) return true
  // const result = existingDrivers.filter(o1 => newNode.drivers.some(o2 => o1.driver !== o2.driver))
  const result = []
  const lengthsMatch = existingDrivers.length === newNode.drivers.length
  if (lengthsMatch) {
    existingDrivers.forEach(o1 => {
      let found = false
      newNode.drivers.forEach(o2 => {
        if (o1.driver === o2.driver) found = true
      })
      if (!found) result.push(o1)
    })
  }
  if (!lengthsMatch || result.length > 0) {
    await driver.removeAllNode(uuid, profileNum, newNode.address)
    return true
  }
  return false
}

async function checkNodeDefAndHint(uuid, profileNum, newNode, existingNode) {
  const updateObject = {}
  if (u.isIn(newNode, 'hint'))
    if (u.convertHint(newNode.hint) !== existingNode.hint) {
      updateObject.hint = u.convertHint(newNode.hint)
      logger.debug(
        `[${uuid}_${profileNum}] ${
          newNode.address
        } hint change detected. Updated to ${u.convertHint(newNode.hint)}`
      )
    }
  if (u.isIn(newNode, 'nodeDefId'))
    if (newNode.nodeDefId !== existingNode.nodeDefId) {
      updateObject.nodeDefId = newNode.nodeDefId
      logger.debug(
        `[${uuid}_${profileNum}] ${newNode.address} nodeDefId change detected. Updated to ${newNode.nodeDefId}`
      )
      await isyNodeServer.changeNodeDef(uuid, profileNum, newNode)
    }
  if (Object.keys(updateObject).length > 0) {
    await node.update(uuid, profileNum, newNode.address, updateObject)
  }
}

async function changenode([uuid, profileNum], cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  if (data.length <= 0) throw new Error(`${cmd} has no entries.`)
  return Promise.all(
    Object.values(data).map(async item => {
      const result = {
        address: item.address,
        nodeDefId: item.nodeDefId
      }
      try {
        if (typeof item !== 'object') throw new Error(`driver object invalid`)
        if (!u.hasProps(item, API[cmd].props))
          throw new Error(`${cmd} object does not have the correct properties`)
        const updateObject = {}
        updateObject.nodeDefId = item.nodeDefId
        logger.info(
          `[${uuid}_${profileNum}] ${item.address} changing nodeDefId. Updated to ${item.nodeDefId}`
        )
        await isyNodeServer.changeNodeDef(uuid, profileNum, item)
        await node.update(uuid, profileNum, item.address, updateObject)
        return { ...result, success: true }
      } catch (err) {
        logger.error(`command ${cmd} ${err.message}`)
        return { ...result, success: false, error: err.message }
      }
    })
  )
}

async function command([uuid, profileNum], cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  if (data.length <= 0) throw new Error(`${cmd} has no entries.`)
  return Promise.all(
    Object.values(data).map(async item => {
      const result = {
        address: item.address,
        command: item.command
      }
      try {
        if (typeof item !== 'object') throw new Error(`driver object invalid`)
        if (!u.hasProps(item, API[cmd].props))
          throw new Error(`${cmd} object does not have the correct properties`)
        logger.info(`[${uuid}_${profileNum}] ${item.address} reporting command ${item.command}`)
        await isyNodeServer.sendCommand(uuid, profileNum, item)
        return { ...result, success: true }
      } catch (err) {
        logger.error(`command ${cmd} ${err.message}`)
        return { ...result, success: false, error: err.message }
      }
    })
  )
}

const API = {
  addnode: {
    props: ['address', 'primaryNode', 'nodeDefId', 'drivers'],
    func: addnode
  },
  removenode: {
    props: ['address'],
    func: removenode
  },
  changenode: {
    props: ['address', 'nodeDefId'],
    func: changenode
  },
  command: {
    props: ['address', 'command'],
    func: command
  }
}

module.exports = { API, removenode }
