/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign
  */
/**
 * Nodeserver Drivers
 * @module mqtt/frontend/isy
 * @version 3.0
 */
const servicens = require('../../services/nodeservers')
/**
 * @route {installNs} udi/pg3/frontend/isy/admin
 * @param {Object} data Request body
 * @param {Object} data.installNs
 * @param {string} data.installNs.uuid
 * @param {string} data.installNs.name
 * @param {number} data.installNs.profileNum
 * @param {string} data.installNs.url
 * @example <caption>Request</caption>
{
  "id": "2343",
  "installNs": {
    "uuid": "00:21:b9:02:45:1b",
    "name": "Test123",
    "profileNum": "2",
    "url": "https://github.com/Einstein42/udi-poly-template-python.git"
  }
}
 * @example <caption>Response</caption>
{
  "id": "2343",
  "installNs": {
    "id": "2bc8b443-201a-4296-a4ba-3225ffb5ae8a",
    "uuid": "00:21:b9:02:45:1b",
    "token": "gJUdl/TfzOFVaia3",
    "name": "Test123",
    "profileNum": 2,
    "timeAdded": 1594749069072,
    "timeStarted": null,
    "timeModified": 1594749069072,
    "version": "2.1.1",
    "home": "/Users/e42/.pg3/ns/00:21:b9:02:45:1b_2",
    "log": "logs/debug.log",
    "logLevel": "DEBUG",
    "enabled": 1,
    "type": "python3",
    "executable": "template-poly.py",
    "shortPoll": 60,
    "longPoll": 300,
    "customparams": null,
    "customdata": null,
    "customparamsdoc": null,
    "customtypeddata": null,
    "customtypedparams": null,
    "notices": null,
    "dbVersion": 1,
    "devMode": 0,
    "branch": "master",
    "success": true
  }
}
 */
async function installNs(id, cmd, data) {
  return servicens.createNs(data)
}
/**
 * @route {removeNs} udi/pg3/frontend/isy/admin
 * @param {Object} data Request body
 * @param {Object} data.removeNs
 * @param {string} data.removeNs.uuid
 * @param {string} data.removeNs.name
 * @param {number} data.removeNs.profileNum
 * @example <caption>Request</caption>
{
  "id": 13423,
  "removeNs": {
    "uuid": "00:21:b9:02:45:1b",
    "name": "Test123",
    "profileNum": "2"
  }
}
 * @example <caption>Response</caption>
{
  "id": 13423,
  "removeNs": {
    "uuid": "00:21:b9:02:45:1b",
    "name": "Test123",
    "profileNum": "2",
    "success": true
  }
}
 */
async function removeNs(id, cmd, data) {
  return servicens.removeNs(data)
}

async function changeNsBranch(id, cmd, data) {}
/**
 * @route {getNodeServers} udi/pg3/frontend/isy/admin
 * @param {Object} data Request body
 * @param {Object} data.getNodeServers
 * @param {string} data.getNodeServers.uuid
 * @example <caption>Request</caption>
{
  "getNodeServers": {
    "uuid": "00:21:b9:02:45:1b"
  }
}
 * @example <caption>Response</caption>
{
  "getNodeServers": [
    {
      "id": "e82f459c-4931-4c29-aead-f93f6f310969",
      "uuid": "00:21:b9:02:45:1b",
      "token": "IT1ISs1PmGxZVq9+",
      "name": "ISY Portal",
      "profileNum": 1,
      "timeAdded": 1595004228417,
      "timeStarted": null,
      "timeModified": 1595004228417,
      "version": "0.0.0",
      "home": "none",
      "log": "logs/debug.log",
      "logLevel": "DEBUG",
      "enabled": 1,
      "type": "unmanaged",
      "executable": "none",
      "shortPoll": 60,
      "longPoll": 300,
      "customparams": null,
      "customdata": null,
      "customparamsdoc": null,
      "customtypeddata": null,
      "customtypedparams": null,
      "notices": null,
      "dbVersion": 1,
      "devMode": 0,
      "branch": "master",
      "nodeCount": 0
    }
  ]
}
 */
async function getNodeServers(id, cmd, data) {
  return servicens.getAllNs(data)
}

const API = {
  installNs: {
    props: ['uuid', 'name', 'profileNum', 'url'],
    func: installNs
  },
  removeNs: {
    props: ['uuid', 'name', 'profileNum'],
    func: removeNs
  },
  changeNsBranch: {
    props: ['uuid', 'name', 'profileNum', 'branch'],
    func: changeNsBranch
  },
  getNodeServers: {
    props: ['uuid'],
    func: getNodeServers
  }
}

module.exports = { API }
