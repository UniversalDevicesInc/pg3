const qs = require('querystring')

const config = require('../../config/config')

/* Bottleneck priority higher = more priority
 * Set here for easy tweaking
 */
const PRIORITY = {
  system: 7,
  command: 6,
  status: 5
}

class Response {
  constructor(id = false, success = false, message = null, extra = {}) {
    this.id = id
    this.success = success
    this.message = message
    this.extra = extra
  }
}

const TYPES = ['system', 'command', 'status']

function random5Digit() {
  return Math.floor(Math.random() * 90000) + 10000
}

function getIsyConfig(uuid) {
  if (typeof config.isys === 'object') return config.isys.find(isy => isy.uuid === uuid)
  return null
}

function addNodePrefix(profileNum, id) {
  return `n${`00${profileNum}`.slice(-3)}_${id}`.slice(0, 20)
}

function makeSystemUrl(uuid, path, args = null) {
  if (!uuid) return null
  const isy = getIsyConfig(uuid)
  let url = `${isy.secure === 1 ? 'https://' : 'http://'}${isy.ip}:${isy.port}/${path.join('/')}`
  if (args) {
    url += `?${qs.stringify(args).trim()}`
  }
  return url
}

function makeNodeUrl(uuid, profileNum, path, args = null) {
  if (!uuid) return null
  const isy = getIsyConfig(uuid)
  let url = `${isy.secure === true ? 'https://' : 'http://'}${isy.ip}:${isy.port}/rest/ns/${profileNum}/${path.join(
    '/'
  )}`
  if (args) {
    url += `?${qs.stringify(args).trim()}`
  }
  return url
}

async function isyGet(uuid, type, url, profileNum = 0) {
  if (!uuid || !type || !url) return null
  if (!TYPES.includes(type)) return null
  const isy = getIsyConfig(uuid)
  const options = {
    id: `${type}${random5Digit()}`,
    priority: PRIORITY[type]
  }
  if (type === 'system') {
    return config.queue[isy.uuid][type].schedule(options, () => config.httpClient[isy.uuid].get(`${url}`, { isy }))
  }
  return config.queue[isy.uuid][`${type}Group`]
    .key(`${profileNum}`)
    .schedule(options, () => config.httpClient[isy.uuid].get(`${url}`, { isy }))
}

async function isyPost(uuid, type, url, data, httpOpts = {}, profileNum = 0) {
  if (!uuid || !type || !url) return null
  if (!TYPES.includes(type)) return null
  const isy = getIsyConfig(uuid)
  const options = {
    id: `${type}${random5Digit()}`,
    priority: PRIORITY[type]
  }
  Object.assign(httpOpts, { isy })
  if (type === 'system') {
    return config.queue[isy.uuid][type].schedule(options, async () =>
      config.httpClient[isy.uuid].post(`${url}`, data, httpOpts)
    )
  }
  return config.queue[isy.uuid][`${type}Group`]
    .key(`${profileNum}`)
    .schedule(options, async () => config.httpClient[isy.uuid].get(`${url}`, data, httpOpts))
}

const propExists = (obj, path) => {
  return !!path.split('.').reduce((obj, prop) => {
    return obj && obj[prop] ? obj[prop] : undefined
  }, obj)
}

const verifyProps = (message, props) => {
  const confirm = {
    valid: true,
    missing: null
  }
  Object.values(props).map(prop => {
    if (!propExists(message, prop)) {
      confirm.valid = false
      confirm.missing = prop
    }
    return prop
  })
  return confirm
}

module.exports = { isyGet, isyPost, addNodePrefix, makeSystemUrl, makeNodeUrl, getIsyConfig, Response, verifyProps }
