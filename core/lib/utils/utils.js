const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)
const isIn = (obj, key) => Object.keys(obj).includes(key)

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms))

const propExists = (obj, path) => {
  return !!path.split('.').reduce((o, prop) => {
    return o && o[prop] ? o[prop] : undefined
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

const convertHint = hint => {
  if (!Array.isArray(hint)) {
    return hint
  }
  return `0x${hint
    .map(value => {
      const s = value.toString(16)
      return s.length > 1 ? s : `0${s}`
    })
    .join('')}`
}

const hasProps = (obj, props) => props.every(prop => Object.keys(obj).includes(prop))

module.exports = { hasOwn, isIn, verifyProps, hasProps, convertHint, timeout }
