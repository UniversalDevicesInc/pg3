const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key)
const isIn = (key, obj) => Object.keys(obj).includes(key)

module.exports = { hasOwn, isIn }
