const os = require('os')

const logger = require('./logger')
const config = require('../config/config')
const secure = require('../models/secure')

const selfsigned = require('../utils/selfsigned')

/**
 * Certificates Module
 * @module modules/certificates
 * @version 3.0
 */

const ATTRIBUTES = [
  { name: 'commonName', value: os.hostname() },
  { name: 'countryName', value: 'US' },
  { shortName: 'ST', value: 'California' },
  { name: 'localityName', value: 'Los Angeles' },
  { name: 'organizationName', value: 'Universal Devices' },
  { shortName: 'OU', value: 'pg3' }
]

async function saveCustom(customCerts) {
  if (!customCerts) throw new Error(`CustomCerts Object required`)
  if (config.customSslData) await secure.remove('customCerts')
  config.customSslData = customCerts
  secure.add('customCerts', customCerts)
}

async function regenerate() {
  logger.info(`Regenerating certificates`)
  if (config.sslData) await secure.remove('certs')
  const opts = {
    keySize: 2048,
    algorithm: 'sha256',
    days: 365 * 10,
    clientCertificate: true,
    clientCertificateCN: 'pg3_client',
    extensions: [
      {
        name: 'subjectAltName',
        altNames: [
          {
            type: 2,
            value: os.hostname()
          },
          {
            type: 2,
            value: 'pg3.local'
          },
          {
            type: 2,
            value: 'polisy.local'
          },
          {
            type: 2,
            value: 'pg3'
          },
          {
            type: 2,
            value: 'polisy'
          },
          {
            type: 2,
            value: 'localhost'
          },
          {
            type: 7,
            ip: config.globalsettings.ipAddress
          },
          {
            type: 7,
            ip: '127.0.0.1'
          }
        ]
      }
    ]
  }
  config.sslData = await selfsigned.generate(ATTRIBUTES, opts)
  secure.add('certs', config.sslData)
}

async function start() {
  config.sslData = JSON.parse(await secure.get('certs'))
  config.customSslData = JSON.parse(await secure.get('customCerts'))
  if (!config.sslData) {
    logger.info(`No Certificates found. Generating`)
    await regenerate()
  }
}

// API
module.exports = { start, regenerate, saveCustom }
