/* eslint-disable
  no-use-before-define,
  no-underscore-dangle,
  no-param-reassign
  */

async function reboot(id, cmd, data) {
  console.log(id, cmd, data)
}
async function set() {}

const API = {
  reboot: {
    props: ['uuid', 'name', 'profileNum', 'url'],
    func: reboot
  }
}

module.exports = { API }
