const config = require('../../config/config')
const logger = require('../logger')

const core = require('./core')

async function reboot(uuid) {
  const result = {
    message: null,
    success: false,
    extra: {}
  }
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
  try {
    const res = await core.isyPost(uuid, 'system', url, data, options)
    if (res && res.status === 200) {
      result.success = true
      result.message = `Reboot command sent to ISY sucessfully.`
    } else {
      result.message = `Reboot command not sent to ISY sucessfully. Status Code: ${res.statusCode}`
    }
    logger.debug(`ISY: ${result.message}`)
  } catch (err) {
    result.message = `Reboot command not sent to ISY sucessfully.`
    logger.error(`ISY: ${result.message} ${err}`)
  }
  return result
}

module.exports = { reboot }
