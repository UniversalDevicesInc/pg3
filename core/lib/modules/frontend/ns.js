/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign
  */
/**
 * Nodeserver Drivers
 * @module mqtt/frontend/ns
 * @version 3.0
 */
const logger = require('../logger')

const ns = require('../../models/nodeserver')
const servicens = require('../../services/nodeservers')
const custom = require('../../models/custom')
const nscustom = require('../nodeserver/custom')
const nscommand = require('../nodeserver/command')
/**
 * @route {getNs} udi/pg3/frontend/ns/admin
 * @param {Object} data Request body
 * @param {Object} data.getNs
 * @param {string} data.getNs.uuid
 * @param {number} data.getNs.profileNum
 * @example <caption>Request</caption>
{
  "getNs": {
    "uuid": "00:21:b9:02:45:1b",
    "profileNum": 2
  }
}
 * @example <caption>Response</caption>
{
  "getNs": {
    "id": "d612bef2-ad01-4aa4-a1ee-d0530f1cc038",
    "uuid": "00:21:b9:02:45:1b",
    "token": "go-PQ7rLG)Bw+AWW",
    "name": "PythonTemplate",
    "nickname": null,
    "profileNum": 2,
    "timeAdded": 1595544052286,
    "timeStarted": 1595547746962,
    "timeModified": 1595547748176,
    "version": "2.1.1",
    "branch": "master",
    "url": "https://github.com/Einstein42/udi-poly-template-python.git",
    "home": "/Users/e42/.pg3/ns/00:21:b9:02:45:1b_2",
    "log": "logs/debug.log",
    "logLevel": "DEBUG",
    "enabled": 1,
    "connected": 1,
    "devMode": 0,
    "type": "python3",
    "executable": "template-poly.py",
    "shortPoll": 120,
    "longPoll": 240,
    "customparams": null,
    "customdata": null,
    "customparamsdoc": null,
    "customtypeddata": null,
    "customtypedparams": null,
    "notices": null,
    "dbVersion": 1,
    "nodeCount": 0
  }
}
 */
async function getNs(id, cmd, data) {
  return servicens.getNs(data)
}
/**
 * @route {getNodes} udi/pg3/frontend/ns/admin
 * @param {Object} data Request body
 * @param {Object} data.getNodes
 * @param {string} data.getNodes.uuid
 * @param {number} data.getNodes.profileNum
 * @example <caption>Request</caption>
{
  "getNodes": {
    "uuid": "00:21:b9:02:45:1b",
    "profileNum": 2
  }
}
 * @example <caption>Response</caption>
{
  "getNodes": [
    {
      "id": "fdf37143-e037-48f1-8904-6ed094be3373",
      "uuid": "00:21:b9:02:45:1b",
      "profileNum": 2,
      "address": "controller",
      "name": "Template Controller",
      "nodeDefId": "controller",
      "nls": null,
      "hint": "0x00000000",
      "controller": 0,
      "primaryNode": "controller",
      "isPrimary": 1,
      "enabled": 1,
      "timeAdded": 1595552956711,
      "timeModified": 1595552956711,
      "dbVersion": 1,
      "drivers": [
        {
          "id": "dd099905-dcb2-4001-885a-2364b75a3141",
          "uuid": "00:21:b9:02:45:1b",
          "profileNum": 2,
          "address": "controller",
          "driver": "GV1",
          "value": "29.3",
          "uom": 19,
          "timeAdded": 1595552957124,
          "timeModified": 1595625042541,
          "dbVersion": 1
        }
      ]
    }
  ]
}
 */
async function getNodes(id, cmd, data) {
  return servicens.getNodes(data)
}
/**
 * @route {startNs} udi/pg3/frontend/ns/admin
 * @param {Object} data Request body
 * @param {Object} data.startNs
 * @param {string} data.startNs.uuid
 * @param {number} data.startNs.profileNum
 * @example <caption>Request</caption>
{
  "startNs": {
    "uuid": "00:21:b9:02:45:1b",
    "profileNum": 2
  }
}
 * @example <caption>Successful Response</caption>
{
  "startNs": {
    "success": true
  }
}
 * @example <caption>Error Response</caption>
{
  "startNs": {
    "error": "string"
  }
}
 */
async function startNs(id, cmd, data) {
  const { uuid, profileNum } = data
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    return servicens.startNs(nodeServer, true)
  } catch (err) {
    logger.error(`startNs: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}
/**
 * @route {stopNs} udi/pg3/frontend/ns/admin
 * @param {Object} data Request body
 * @param {Object} data.stopNs
 * @param {string} data.stopNs.uuid
 * @param {number} data.stopNs.profileNum
 * @example <caption>Request</caption>
{
  "stopNs": {
    "uuid": "00:21:b9:02:45:1b",
    "profileNum": 2
  }
}
 * @example <caption>Successful Response</caption>
{
  "stopNs": {
    "success": true
  }
}
 * @example <caption>Error Response</caption>
{
  "stopNs": {
    "error": "string"
  }
}
 */
async function stopNs(id, cmd, data) {
  const { uuid, profileNum } = data
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    return servicens.stopNs(nodeServer, false)
  } catch (err) {
    logger.error(`stopNs: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}
/**
 * @route {restartNs} udi/pg3/frontend/ns/admin
 * @param {Object} data Request body
 * @param {Object} data.restartNs
 * @param {string} data.restartNs.uuid
 * @param {number} data.restartNs.profileNum
 * @example <caption>Request</caption>
{
  "restartNs": {
    "uuid": "00:21:b9:02:45:1b",
    "profileNum": 2
  }
}
 * @example <caption>Successful Response</caption>
{
  "restartNs": {
    "success": true
  }
}
 * @example <caption>Error Response</caption>
{
  "restartNs": {
    "error": "string"
  }
}
 */
async function restartNs(id, cmd, data) {
  const { uuid, profileNum } = data
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    return servicens.restartNs(nodeServer)
  } catch (err) {
    logger.error(`restartNs: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}

/**
 * @route {loadProfile} udi/pg3/frontend/ns/admin
 * @param {Object} data Request body
 * @param {Object} data.loadProfile
 * @param {string} data.loadProfile.uuid
 * @param {number} data.loadProfile.profileNum
 * @example <caption>Request</caption>
{
  "loadProfile": {
    "uuid": "00:21:b9:02:45:1b",
    "profileNum": 2
  }
}
 * @example <caption>Successful Response</caption>
{
  "loadProfile": {
    "success": true
  }
}
 * @example <caption>Error Response</caption>
{
  "loadProfile": {
    "error": "string"
  }
}
 */
async function loadProfile(id, cmd, data) {
  const { uuid, profileNum } = data
  try {
    const nodeServer = await ns.get(uuid, profileNum)
    return servicens.loadProfile(nodeServer)
  } catch (err) {
    logger.error(`loadProfile: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}

/**
 * @route {removeNode} udi/pg3/frontend/ns/admin
 * @param {Object} data Request body
 * @param {Object} data.removeNode
 * @param {string} data.removeNode.uuid
 * @param {number} data.removeNode.profileNum
 * @param {string} data.getCustom.address
 * @example <caption>Request</caption>
{
  "removeNode": {
    "uuid": "00:21:b9:02:45:1b",
    "profileNum": 2,
    "address": "templateaddr"
  }
}
 * @example <caption>Response</caption>
{
  "removeNode": {
      "address": "templateaddr",
      "success": true,
      ?error: "string"
    }
}
 */
async function removeNode(id, cmd, data) {
  const { uuid, profileNum, address } = data
  const response = await nscommand.removenode([uuid, profileNum], 'removenode', [{ address }])
  if (Array.isArray(response)) return response[0]
  return response
}

async function updateNotices(id, cmd, data) {
  const { uuid, profileNum, notices } = data
  try {
    await custom.add(uuid, profileNum, 'notices', JSON.stringify(notices))
    return { success: true }
  } catch (err) {
    logger.error(`updateNotices: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}
/**
 * @route {getCustom} udi/pg3/frontend/ns/admin
 * @param {Object} data Request body
 * @param {Object} data.getCustom
 * @param {string} data.getCustom.uuid
 * @param {number} data.getCustom.profileNum
 * @param {Object[]} data.getCustom.keys
 * @param {string} data.getCustom.keys.key
 * @example <caption>Request</caption>
{
  "getCustom": {
    "uuid": "00:21:b9:02:45:1b",
    "profileNum": 2,
    "keys": [
      {"key": "customparams"},
      {"key": "customparamsdoc"},
      {"key": "customtypedparams"}
      ]
  }
}
 * @example <caption>Response</caption>
{
  "getCustom": [
    {
      "id": "df613de1-3957-4257-b6c3-4ca2e001ef6f",
      "uuid": "00:21:b9:02:45:1b",
      "profileNum": 2,
      "key": "customparams",
      "value": "{abc: def}",
      "dbVersion": 1
    }
  ]
}
 */

async function setLogLevel(id, cmd, data) {
  const { uuid, profileNum, level } = data
  try {
    const nodeServer = await ns.get(uuid, profileNum)

    nodeServer.logLevel = level

    await ns.update(uuid, profileNum, { logLevel: level })

    /* send new level to node server */
    return servicens.sendLogLevel(nodeServer)
  } catch (err) {
    logger.error(`setLogLevel: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}

async function setLogList(id, cmd, data) {
  const { uuid, profileNum, levels } = data
  try {
    const nodeServer = await ns.get(uuid, profileNum)

    nodeServer.logLevelList = levels

    await ns.update(uuid, profileNum, { logLevelList: levels })

    /* send new level to node server */
    return servicens.sendLogLevelList(nodeServer)
  } catch (err) {
    logger.error(`setLogLevelList: ${err.stack}`)
  }
  return { success: false, error: 'Failed, check log for details.' }
}

async function getCustom(id, cmd, data) {
  const { uuid, profileNum, keys } = data
  return nscustom.get([uuid, profileNum], 'get', keys)
}
/**
 * @route {setCustom} udi/pg3/frontend/ns/admin
 * @param {Object} data Request body
 * @param {Object} data.setCustom
 * @param {string} data.setCustom.uuid
 * @param {number} data.setCustom.profileNum
 * @param {Object[]} data.getCustom.keys
 * @param {string} data.getCustom.keys.key
 * @param {string} data.getCustom.keys.value
 * @example <caption>Request</caption>
{
  "setCustom": {
    "uuid": "00:21:b9:02:45:1b",
    "profileNum": 2,
    "keys": [{"key": "customparams", "value": "{\"abc\": \"def\"}"}]
  }
}
 * @example <caption>Response</caption>
{
  "setCustom": [
    {
      "success": true,
      "key": "customparams"
    }
  ]
}
 */
async function setCustom(id, cmd, data) {
  const { uuid, profileNum, keys } = data
  return nscustom.set([uuid, profileNum], 'set', keys)
}

async function setPolls(id, cmd, data) {
  const { uuid, profileNum, short, long } = data
  try {
    await ns.update(uuid, profileNum, { shortPoll: short, longPoll: long })
    const currentNs = await ns.get(uuid, profileNum)
    await servicens.stopPolls(currentNs)
    await servicens.startPolls(currentNs)
    return { success: true }
  } catch (err) {
    logger.error(`setPolls: ${err.stack}`)
    return { success: false, error: `${err.message}` }
  }
}

const API = {
  getNs: {
    props: ['uuid', 'profileNum'],
    func: getNs
  },
  getNodes: {
    props: ['uuid', 'profileNum'],
    func: getNodes
  },
  startNs: {
    props: ['uuid', 'profileNum'],
    func: startNs
  },
  stopNs: {
    props: ['uuid', 'profileNum'],
    func: stopNs
  },
  restartNs: {
    props: ['uuid', 'profileNum'],
    func: restartNs
  },
  loadProfile: {
    props: ['uuid', 'profileNum'],
    func: loadProfile
  },
  removeNode: {
    props: ['uuid', 'profileNum', 'address'],
    func: removeNode
  },
  updateNotices: {
    props: ['uuid', 'profileNum', 'notices'],
    func: updateNotices
  },
  setLogLevel: {
    props: ['uuid', 'profileNum', 'level'],
    func: setLogLevel
  },
  setLogLevelList: {
    props: ['uuid', 'profileNum', 'levels'],
    func: setLogList
  },
  getCustom: {
    props: ['uuid', 'profileNum', 'keys'],
    func: getCustom
  },
  setCustom: {
    props: ['uuid', 'profileNum', 'keys'],
    func: setCustom
  },
  setPolls: {
    props: ['uuid', 'profileNum', 'short', 'long'],
    func: setPolls
  }
}

module.exports = { API }
