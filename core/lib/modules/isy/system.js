const convert = require('xml2js')
const axios = require('axios')

const logger = require('../logger')
const core = require('./core')

async function reboot(uuid) {
  const result = {
    message: null,
    success: false
  }
  try {
    const data = `<s:Envelope>
                <s:Body>
                  <u:Reboot xmlns:u="urn:udi-com:service:X_Insteon_Lighting_Service:1">
                    <code></code>
                  </u:Reboot>
                </s:Body>
              </s:Envelope>`
    const url = core.makeSystemUrl(uuid, ['services'])
    const options = {
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    }
    const res = await core.isyPost(uuid, 'system', url, data, options)
    if (res && res.status === 200) {
      result.success = true
      result.message = `Reboot command sent to ISY successfully.`
    } else {
      result.message = `Reboot command not sent to ISY successfully. Status Code: ${res.statusCode}`
    }
    logger.debug(`ISY: ${result.message}`)
  } catch (err) {
    result.error = `Reboot command not sent to ISY successfully.`
    logger.error(`ISY: ${result.message} ${err}`)
  }
  return result
}

async function groupNodes(uuid, profileNum, address, primary) {
  const result = {
    message: null,
    success: false
  }
  if (address === primary) {
    result.message = `Cannot group node to itself`
    return result
  }
  try {
    const data = `<s:Envelope>
                <s:Body>
                  <u:SetParent xmlns:u="urn:udi-com:service:X_Insteon_Lighting_Service:1">
                    <node>${core.addNodePrefix(profileNum, address)}</node>
                    <nodeType>1</nodeType>
                    <parent>${core.addNodePrefix(profileNum, primary)}</parent>
                    <parentType>1</parentType>
                  </u:SetParent>
                </s:Body>
              </s:Envelope>`
    const url = core.makeSystemUrl(uuid, ['services'])
    const options = {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        SOAPACTION: 'urn:udi-com:service:X_Insteon_Lighting_Service:1#SetParent'
      }
    }
    const res = await core.isyPost(uuid, 'system', url, data, options)
    if (res && res.status === 200) {
      result.success = true
      result.message = `Group command sent to ISY sucessfully.`
    } else {
      result.message = `Group command not sent to ISY sucessfully. Status Code: ${res.statusCode}`
    }
    logger.debug(`ISY: ${result.message}`)
    return result
  } catch (err) {
    result.message = `Group command not sent to ISY sucessfully. No response received.`
    logger.error(`ISY: ${result.message} ${err}`)
    return result
  }
}

async function getExistingNodeServers(uuid) {
  const response = await core.isyGet(
    uuid,
    'system',
    core.makeSystemUrl(uuid, ['rest/profiles/ns/0/connection'])
  )
  const opts = {
    trim: true,
    async: true,
    mergeAttrs: true,
    explicitArray: false
  }
  if (response.status !== 200) {
    throw new Error(`Received ${response.status} from the ISY. Check your credentials`)
  }
  const converted = await convert.parseStringPromise(response.data, opts)
  return converted.connections.connection
}

async function getUuid(isy) {
  const { ip, port, secure } = isy
  const url = `${secure === 1 ? 'https' : 'http'}://${ip}:${port}/desc`
  try {
    const result = { success: true }
    const response = await axios.get(url)
    const opts = {
      trim: true,
      async: true,
      mergeAttrs: true,
      explicitArray: false
    }
    const converted = await convert.parseStringPromise(response.data, opts)
    result.version = converted.root.device.modelVersion
    result.uuid = converted.root.device.UDN.slice(5)
    return result
  } catch (err) {
    logger.error(`getUuid :: ${err.stack}`)
    return { success: false, error: `${err.message}` }
  }
}

module.exports = { reboot, groupNodes, getExistingNodeServers, getUuid }
