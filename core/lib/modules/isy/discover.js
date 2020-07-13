/*
  eslint no-bitwise: 0,
  prefer-destructuring: 0,
  no-plusplus: 0
  no-underscore-dangle: 0
  */

const axios = require('axios')
const convert = require('xml2js')

const logger = require('../logger')

function wait(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function longToByteArray(/* long */ long) {
  // we want to represent the input as a 8-bytes array
  const byteArray = Buffer.alloc(4)
  byteArray[0] = (long & 0xff000000) >> 24
  byteArray[1] = (long & 0x00ff0000) >> 16
  byteArray[2] = (long & 0x0000ff00) >> 8
  byteArray[3] = long & 0x000000ff
  return byteArray
}

const isyVal = '4e455442'
const dwIdKey = longToByteArray(0x4255524e)
const bNetBurnerPktType = Buffer.alloc(1, 'R')
const bAction = Buffer.alloc(1)
const bExtra1 = Buffer.alloc(1)
const bExtra2 = Buffer.alloc(1)
const randomRecordNum = longToByteArray(Math.floor(Math.random() * 9000000000))
const dwThisAddr = longToByteArray(Math.floor(Math.random() * 9000000000))
const dwThisLen = Buffer.alloc(4)
const endLen = Buffer.alloc(4)
let extra = ''
const PORT = 20034
let found = false
let discovered = 0
let port = ''
let ip = ''
let uuid = ''
let version = ''
let secure = 0

function getBroadcast() {
  const ifaces = require('os').networkInterfaces()
  const int = require('ip')
  let bCast = null
  Object.keys(ifaces).forEach(ifname => {
    // let alias = 0
    ifaces[ifname].forEach(iface => {
      if (int.address() === iface.address) {
        bCast = int.subnet(iface.address, iface.netmask).broadcastAddress
      }
    })
  })
  return bCast
}

function getPacket() {
  const rec = Buffer.alloc(24)
  let i = 0
  dwIdKey.forEach((val, k) => {
    rec[i++] = dwIdKey[k]
  })
  rec[i++] = bNetBurnerPktType[0]
  rec[i++] = bAction[0]
  rec[i++] = bExtra1[0]
  rec[i++] = bExtra2[0]
  randomRecordNum.forEach((val, k) => {
    rec[i++] = randomRecordNum[k]
  })
  dwThisAddr.forEach((val, k) => {
    rec[i++] = dwThisAddr[k]
  })
  dwThisLen.forEach((val, k) => {
    rec[i++] = dwThisLen[k]
  })
  endLen.forEach((val, k) => {
    rec[i++] = endLen[k]
  })
  return rec
}

async function getUuid() {
  const url = `${secure === 1 ? 'https' : 'http'}://${ip}:${port}/desc`
  try {
    const response = await axios.get(url)
    const opts = {
      trim: true,
      async: true,
      mergeAttrs: true,
      explicitArray: false
    }
    const converted = await convert.parseStringPromise(response.data, opts)
    version = converted.root.device.modelVersion
    uuid = converted.root.device.UDN.slice(5)
    discovered = 1
  } catch (err) {
    logger.error(`getUuid ${err.stack}`)
  }
}

async function find() {
  const message = getPacket()
  const client = require('dgram').createSocket('udp4')
  let Socket = false
  client.on('listening', () => {
    client.setBroadcast(true)
    Socket = true
  })

  client.on('message', async msg => {
    if (msg.readIntBE(0, 4).toString(16) === isyVal) {
      let i = 152
      while (i <= msg.length) {
        const char = msg.slice(i, i + 1)
        extra += char.toString('utf8')
        i += 1
      }
      const index = extra.indexOf('//')
      if (index > -1) {
        if (extra.indexOf('https') > -1) secure = 1
        const addr = extra.slice(index + 2, extra.indexOf('/desc'))
        const portIndex = addr.indexOf(':')
        if (portIndex > -1) {
          ip = addr.slice(0, portIndex)
          port = addr.slice(portIndex + 1)
        } else {
          ip = addr
          port = secure === 1 ? 443 : 80
        }
      }
      found = true
      client.close()
    }
  })

  const p = new Promise(resolve => {
    client.on('close', async () => {
      Socket = false
      if (found) {
        await getUuid()
      }
      resolve({ discovered, ip, port, uuid, version, secure })
    })
  })

  client.send(message, 0, message.length, PORT, getBroadcast())
  // Wait 1000ms for ISY response.
  wait(1000).then(() => {
    if (Socket) {
      client.close()
    }
  })
  return p
}

module.exports = { find }
