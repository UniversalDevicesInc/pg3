const config = require('../../config/config')
const logger = require('../logger')
const core = require('./core')

async function configuration(message) {
  console.log(message)
}

async function connected(message) {
  console.log(message)
}

async function polls(message) {
  console.log(message)
}

async function installprofile(message) {
  console.log(message)
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
