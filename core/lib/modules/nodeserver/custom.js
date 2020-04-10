const config = require('../../config/config')
const logger = require('../logger')
const core = require('./core')

async function customparams(message) {
  console.log(message)
}

async function customdata(message) {
  console.log(message)
}

async function customparamsdoc(message) {
  console.log(message)
}

async function typedcustomdata(message) {
  console.log(message)
}

async function typedparams(message) {
  console.log(message)
}

async function addnotice(message) {
  console.log(message)
}

async function removenotice(message) {
  console.log(message)
}

const API = {
  customparams: {
    props: [],
    func: customparams
  },
  customdata: {
    props: [],
    func: customdata
  },
  customparamsdoc: {
    props: [],
    func: customparamsdoc
  },
  typedcustomdata: {
    props: [],
    func: typedcustomdata
  },
  typedparams: {
    props: [],
    func: typedparams
  },
  addnotice: {
    props: [],
    func: addnotice
  },
  removenotice: {
    props: [],
    func: removenotice
  }
}

module.exports = { API }
