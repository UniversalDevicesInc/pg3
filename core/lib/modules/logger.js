/*
Instantiate the logger for all modules
*/
const fs = require('fs')
const { createLogger, format, transports } = require('winston')
require('winston-daily-rotate-file')

/**
 * Logger Module
 * @module modules/logger
 * @version 2.0
 */

/**
 * Default log level is INFO. If .env parameter of NODE_ENV is set to to 'development' then we up the level to DEBUG
 */
const logLevel = 'debug'
const logDir = `${process.env.PG3WORKDIR}logs/`
/**
 * Create logDir if it does not exist
 */
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}
/**
 * Default log level is INFO. If .env parameter of NODE_ENV is set to to 'development' then we log to the console as well as the file.
 */
const transportArray = []

const { combine, timestamp, printf, splat, label, colorize } = format
// var Rotate = require('winston-logrotate').Rotate

const logFormat = printf(info => {
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`
})

const tsFormat = () => new Date().toLocaleString([], { hour12: false })

transportArray.push(
  new transports.Console({
    level: logLevel,
    handleExceptions: true,
    format: combine(
      label({ label: 'pg3' }),
      timestamp({
        format: tsFormat
      }),
      splat(),
      colorize(),
      logFormat
    )
  })
)

transportArray.push(
  new transports.DailyRotateFile({
    filename: `pg3-%DATE%.log`,
    dirname: `${logDir}`,
    level: logLevel,
    maxsize: '100m',
    maxFiles: '14d',
    compress: true,
    handleExceptions: true,
    exitOnError: true,
    tailable: true,
    createSymlink: true,
    symlinkName: 'pg3-current.log',
    format: combine(
      label({ label: 'pg3' }),
      timestamp({
        format: tsFormat
      }),
      splat(),
      logFormat
    )
  })
)

const logger = createLogger({
  transports: transportArray
})

module.exports = logger
