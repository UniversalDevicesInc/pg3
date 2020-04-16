const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)
const isIn = (obj, key) => Object.keys(obj).includes(key)

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

const hasProps = (obj, props) => props.every(prop => Object.keys(obj).includes(prop))

module.exports = { hasOwn, isIn, verifyProps, hasProps }
