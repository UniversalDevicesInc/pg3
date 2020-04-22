/* eslint-disable
  no-use-before-define,
  no-underscore-dangle
  */
const convert = require('xml-js')

const config = require('../../config/config')
const logger = require('../logger')
const u = require('../../utils/utils')

const isy = require('../isy/core')
const isySystem = require('../isy/system')
const isyErrors = require('../isy/errors')
const node = require('../../models/node')
const driver = require('../../models/driver')
const status = require('./status')

async function unwrapArray(uuid, profileNum, cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  return Promise.all(Object.values(data).map(item => cmd(uuid, profileNum, item)))
}

function checkResponse(cmd, response) {
  let reason = null
  if (response.status !== 200) {
    try {
      reason = convert.xml2js(response.data, { compact: true }).RestResponse.reason._attributes.code
      throw new Error(
        `${cmd} failed: ISY returned error: (${reason}) ${isyErrors.ERRORS[reason] || ''}`
      )
    } catch (err) {
      throw new Error(`${cmd} failed: ISY returned status code ${response.status}`)
    }
  }
}

async function addnode([uuid, profileNum], cmd, data) {
  if (!Array.isArray(data)) throw new Error(`${cmd} must be an array`)
  return Promise.all(
    Object.values(data).map(async item => {
      let response = {}
      let existing = {}
      try {
        if (typeof item !== 'object') throw new Error(`driver object invalid`)
        if (!u.hasProps(item, API[cmd].props))
          throw new Error(`driver object does not have the correct properties`)
        existing = await status.getDrivers(uuid, profileNum, {
          address: item.address
        })
        if (existing.drivers)
          throw new Error(`node ${item.address} on profile ${profileNum} already exists. skipping`)
        if (existing.code && existing.code !== 404)
          throw new Error(`ISY returned error code: ${existing.code}`)
        const path = ['nodes', isy.addNodePrefix(profileNum, item.address), 'add', item.nodeDefId]
        response = await isy.isyGet(
          uuid,
          'command',
          isy.makeNodeUrl(uuid, profileNum, path, {
            primary: isy.addNodePrefix(profileNum, item.primaryNode),
            name: item.name || item.address
          }),
          profileNum
        )
        checkResponse(cmd, response)
        await node.add({
          uuid,
          profileNum,
          ...item
        })
        await isySystem.groupNodes(uuid, profileNum, item.address, item.primaryNode)
        return await node.get(uuid, profileNum, item.address)
      } catch (err) {
        logger.error(`command ${cmd} ${err.message}`)
        return {
          address: item.address,
          error: err.message,
          ...(response.status || existing.code ? { code: response.status || existing.code } : {})
        }
      }
    })
  )
}

async function removenode(uuid, profileNum, data) {
  console.log(data)
}

async function command(uuid, profileNum, data) {
  console.log(data)
}

async function restcall(uuid, profileNum, data) {
  console.log(data)
}

async function change(uuid, profileNum, data) {
  console.log(data)
}

const API = {
  addnode: {
    props: ['address', 'primaryNode', 'nodeDefId'],
    func: addnode
  },
  removenode: {
    props: [],
    func: unwrapArray
  },
  command: {
    props: [],
    func: unwrapArray
  },
  restcall: {
    props: [],
    func: unwrapArray
  },
  change: {
    props: [],
    func: unwrapArray
  }
}

module.exports = { API }
