/* eslint-disable
  no-use-before-define
  */
const logger = require('../logger')
const u = require('../../utils/utils')

const isy = require('../isy/core')
const isyNodeServer = require('../isy/nodeserver')
const isyErrors = require('../isy/errors')
const ns = require('../../models/nodeserver')

async function configuration(message) {
  console.log(message)
}

async function connected(message) {
  console.log(message)
}

async function polls(message) {
  console.log(message)
}

async function installprofile([uuid, profileNum], cmd, data) {
  console.log(uuid)
}

async function start(message) {
  console.log(message)
}

async function stop(message) {
  console.log(message)
}

async function restart(message) {
  console.log(message)
}

const API = {
  config: {
    props: [],
    func: configuration
  },
  connected: {
    props: [],
    func: connected
  },
  polls: {
    props: ['shortPoll', 'longPoll'],
    func: polls
  },
  installprofile: {
    props: [],
    func: installprofile
  },
  start: {
    props: [],
    func: start
  },
  stop: {
    props: [],
    func: stop
  },
  restart: {
    props: [],
    func: restart
  }
}

module.exports = { API }
