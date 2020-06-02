// Nodejs encryption with CTR
const crypto = require('crypto')

const config = require('../../config/config')

const outputEncoding = 'hex'
const algorithm = 'aes-256-ctr'

/**
 * The encryption module to encrypt communications between NodeServers and Polyglot
 * this is tested,  however it is not enabled as of release 2.0
 * @module modules/encryption
 * @version 3.0
 */

/**
 * encryptText
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted Text
 */
function encryptText(text) {
  if (!config.pg3key) throw new Error(`Key not found`)
  if (!text) return text
  const iv = Buffer.from(crypto.randomBytes(16))
  const cipher = crypto.createCipheriv(algorithm, config.pg3key, iv)
  let crypted = cipher.update(text)
  crypted = Buffer.concat([crypted, cipher.final()])
  return `${iv.toString(outputEncoding)}:${crypted.toString(outputEncoding)}`
}

/**
 * decryptText
 * @param {string} text - Encrypted value
 * @returns {string} clear text
 */
function decryptText(text) {
  if (!config.pg3key) throw new Error(`Key not found`)
  if (!text) return text
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift(), outputEncoding)
  const encryptedText = Buffer.from(textParts.join(':'), outputEncoding)
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(config.pg3key), iv)
  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

/**
 * generateKey
 * @param {length} integer - Length of Key to generate. Default 32 bytes
 * @returns {buffer} Bytes of length buffer as key
 */
function generateKey(length = 32) {
  return crypto.randomBytes(length)
}

/**
 * randomString
 * @param {length} integer - Length of string to generate. Default 16 characters
 * @returns {text} Random string of length
 */
function randomString(length = 16) {
  let text = ''
  const possible = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz*&-%/!?*+=()'
  for (let i = 0; i < length; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

/**
 * randomAlphaOnlyString
 * @param {length} integer - Length of string(alpha numeric only) to generate. Default 16 characters
 * @returns {text} Random string of length
 */
function randomAlphaOnlyString(length = 16) {
  let text = ''
  const possible = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'
  for (let i = 0; i < length; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

module.exports = { generateKey, randomString, randomAlphaOnlyString, encryptText, decryptText }
