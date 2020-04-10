const config = require('../../config/config')
const logger = require('../logger')
const core = require('./core')

async function addnode(message) {
  console.log(message)
}

async function removenode(message) {
  console.log(message)
}

async function command(message) {
  console.log(message)
}

async function restcall(message) {
  console.log(message)
}

async function change(message) {
  console.log(message)
}

const API = {
  addnode: {
    props: [],
    func: addnode
  },
  removenode: {
    props: [],
    func: removenode
  },
  command: {
    props: [],
    func: command
  },
  restcall: {
    props: [],
    func: restcall
  },
  change: {
    props: [],
    func: change
  }
}

module.exports = { API }
