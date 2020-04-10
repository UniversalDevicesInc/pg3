const config = require('../../config/config')
const logger = require('../logger')
const core = require('./core')

async function get(message) {
  console.log(message)
}

async function set(message) {
  console.log(message)
}

const API = {
  get: {
    props: [],
    func: get
  },
  set: {
    props: [],
    func: set
  }
}

module.exports = { API }
