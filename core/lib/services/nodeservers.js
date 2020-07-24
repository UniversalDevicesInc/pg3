/* eslint-disable no-use-before-define */
const path = require('path')
const fs = require('fs-extra')
const childProcess = require('child_process')
const git = require('simple-git')

const logger = require('../modules/logger')
const config = require('../config/config')
const utils = require('../utils/utils')
const ns = require('../models/nodeserver')
const nodes = require('../models/node')
const isyns = require('../modules/isy/nodeserver')
const isysystem = require('../modules/isy/system')
const nscore = require('../modules/nodeserver/core')
const frontendcore = require('../modules/frontend/core')
const { timeout } = require('../utils/utils')

const VALID_TYPES = ['node', 'python3', 'python', 'binary']

function spawn(name, command, args, opts) {
  const p = new Promise((resolve, reject) => {
    const child = childProcess.spawn(command, args, opts)
    child.on('error', data => {
      logger.error(`child.spawn: ${data}`)
    })
    child.stdout.on('data', data => {
      logger.debug(`NSChild: ${name} ${command}: ${data}`)
    })
    child.stderr.on('data', data => {
      logger.error(`NSChild: ${name} ${command}: ${data}`)
    })
    child.on('close', code => {
      if (code !== 0) reject(new Error(`Non-zero exit code: ${code}`))
      logger.debug(`NSChild: ${name} ${command}: exited with cause code: ${code}`)
      resolve()
    })
  })
  return p
}

/**
 * NodeServer Service
 * @method
 */
async function start() {
  setTimeout(async () => {
    logger.info(`Checking ISY's for installed NodeServers...`)
    await verifyNodeServers()
    setInterval(verifyNodeServers, 5 * 60000) // 5 Minutes
    const nodeservers = await ns.getAllInstalled()
    if (nodeservers.length < 1) return logger.info(`No installed NodeServers found`)
    logger.info(`Starting installed NodeServers...`)
    return Promise.allSettled(
      nodeservers.map(async nodeServer => {
        await startNs(nodeServer)
      })
    )
  }, 1000)
}

/**
 * NodeServer Service
 * @method
 * @param {function} callback - Callback when service is and conneciton is clear.
 */
async function stop() {
  logger.info(`Stopping running NodeServers...`)
  const nodeservers = await ns.getAll()
  return Promise.allSettled(
    nodeservers.map(nodeServer => {
      if (nodeServer.type.toLowerCase() !== 'unmanaged') return stopNs(nodeServer)
    })
  )
}

async function addUnManaged(isy, nodeServer) {
  logger.info(
    `[${isy.uuid}_${nodeServer.profile}] Unmanaged NodeServer '${nodeServer.name}' found. Adding to DB.`
  )
  const addObj = {
    uuid: isy.uuid,
    name: nodeServer.name,
    profileNum: nodeServer.profile,
    version: '0.0.0',
    home: 'none',
    type: 'unmanaged',
    executable: 'none',
    url: 'none'
  }
  try {
    await ns.add(addObj)
  } catch (err) {
    logger.error(`addUnManaged: ${err.stack}`)
  }
}

async function verifyNodeServers() {
  return Promise.allSettled(
    config.isys.map(async isy => {
      let nodeServers
      try {
        nodeServers = await isysystem.getExistingNodeServers(isy.uuid)
      } catch (err) {
        logger.error(`getExistingNodeServers :: ${err.message}`)
        sendFrontend401(isy.uuid)
      }
      const installed = []
      if (!Array.isArray(nodeServers)) nodeServers = [nodeServers]
      await Promise.allSettled(
        nodeServers.map(async nodeS => {
          installed.push(nodeS.profile)
          const dbNs = await ns.get(isy.uuid, nodeS.profile)
          if (!dbNs) {
            await addUnManaged(isy, nodeS)
          } else if (nodeS.name !== dbNs.name) {
            logger.warn(
              `[${isy.uuid}_${nodeS.profile}] ISY has different name for this profile. Removing from PG3.`
            )
            await ns.remove(isy.uuid, nodeS.profile)
            await addUnManaged(isy, nodeS)
          }
        })
      )
      let allNs = await ns.getIsy(isy.uuid)
      if (!Array.isArray(allNs)) allNs = [allNs]
      await Promise.allSettled(
        allNs.map(async nodeS => {
          if (!installed.includes(nodeS.profileNum.toString())) {
            logger.warn(
              `[${isy.uuid}_${nodeS.profileNum}] ISY does not have this NodeServer. Removing from PG3.`
            )
            await ns.remove(isy.uuid, nodeS.profileNum)
          }
        })
      )
    })
  )
}

async function gitClone(uuid, profileNum, url, localDir) {
  // Check if NodeServer folder exists and remove it
  if (uuid && profileNum && fs.existsSync(localDir)) {
    logger.warn(`[${uuid}_${profileNum}] :: NodeServer folder exists, removing... ${localDir}`)
    fs.rmdirSync(localDir, { recursive: true })
  }
  logger.info(`[${uuid}_${profileNum}] :: Cloning repository... ${url} into ${localDir}`)
  await git().clone(url, localDir)
}

// TODO
async function gitCheckout(nodeServer) {}

async function createNs(nodeServer) {
  const { uuid, name, profileNum, url } = nodeServer
  try {
    logger.info(`[${uuid}_${profileNum}] :: Creating Nodeserver '${name}'`)
    const localDir = `${process.env.PG3WORKDIR}ns/${uuid}_${profileNum}`
    await gitClone(uuid, profileNum, url, localDir)
    const serverJson = fs.readJSONSync(`${localDir}/server.json`)
    const addObj = {
      uuid,
      name,
      profileNum,
      version: serverJson.credits[0].version,
      home: localDir,
      type: serverJson.type,
      executable: serverJson.executable,
      devMode: serverJson.testMode,
      branch: (await git(localDir).status()).current,
      url
    }
    await ns.add(addObj)
    const newNs = await ns.get(uuid, profileNum)
    logger.info(`[${uuid}_${profileNum}] :: Clone Complete. Added '${name}' to database...`)
    await isyns.installNodeServer(newNs)
    await installNs(newNs, serverJson)
    await startNs(newNs)
    return { ...newNs, success: true }
  } catch (err) {
    logger.error(`createNS: ${err.stack}`)
    return { ...nodeServer, success: false, error: err.message }
  }
}

async function installNs(nodeServer, serverJson = null) {
  try {
    // eslint-disable-next-line no-param-reassign
    if (!serverJson) serverJson = fs.readJSONSync(`${nodeServer.home}/server.json`)
    if (utils.isIn(serverJson, 'install')) {
      const opts = {
        cwd: nodeServer.home,
        shell: '/bin/bash'
      }
      const runCmd = `/bin/sh ./${serverJson.install}`
      await spawn(`${nodeServer.name}(${nodeServer.profileNum})`, runCmd, [], opts)
    }
    const { version } = serverJson.credits[0]
    if (nodeServer.version !== version)
      logger.info(
        `[${nodeServer.name}(${nodeServer.profileNum})] :: Updated: ${nodeServer.version} => ${version}`
      )
    await ns.update(nodeServer.uuid, nodeServer.profileNum, { version })
    const profileFolder = `${nodeServer.home}/profile`
    const importTypes = ['nodedef', 'editor', 'nls']
    return Promise.allSettled(
      importTypes.map(async type => {
        const pathFolder = `${profileFolder}/${type}`
        let extension = '.xml'
        if (type === 'nls') extension = '.txt'
        const files = fs.readdirSync(pathFolder)
        return Promise.allSettled(
          files.map(async file => {
            if (path.extname(file.toLowerCase()) === extension) {
              const fileData = fs.readFileSync(`${pathFolder}/${file}`)
              await isyns.profileUpload(
                nodeServer.uuid,
                nodeServer.profileNum,
                type,
                file,
                fileData
              )
            }
          })
        )
      })
    )
  } catch (err) {
    return logger.error(`installNs: ${err.stack}`)
  }
}

async function removeAllNs(uuid) {
  try {
    const nodeServers = await ns.getIsy(uuid)
    return Promise.all(
      nodeServers.map(async nodeServer => {
        if (nodeServer.type !== 'unmanaged') await removeNs(nodeServer)
      })
    )
  } catch (err) {
    logger.error(`removeAllNs: ${err.stack}`)
    return { success: false, error: err.message }
  }
}

// TODO send delete to NS
async function removeNs(nodeServer) {
  const { uuid, name, profileNum } = nodeServer
  try {
    logger.info(`[${uuid}_${profileNum})]: Removing NodeServer: ${name}`)
    const existingNs = await ns.get(uuid, profileNum)
    if (!existingNs) throw new Error(`[${uuid}_${profileNum})]: ${name} does not exist.`)
    await stopNs(existingNs)
    const localDir = `${process.env.PG3WORKDIR}ns/${uuid}_${profileNum}`
    // Check if NodeServer folder exists and remove it
    if (uuid && profileNum && fs.existsSync(localDir)) {
      logger.info(`[${uuid}_${profileNum}] :: NodeServer folder exists, removing... ${localDir}`)
      fs.rmdirSync(localDir, { recursive: true })
    }
    await isyns.removeNodeServer(nodeServer)
    await ns.remove(uuid, profileNum)
    return { ...nodeServer, success: true }
  } catch (err) {
    logger.error(`createNS: ${err.stack}`)
    return { ...nodeServer, success: false, error: err.message }
  }
}

async function startNs(nodeServer) {
  if (nodeServer.type.toLowerCase() === 'unmanaged') return { success: false, error: `unmanaged` }
  if (config.nodeProcesses[nodeServer.id]) {
    logger.error(`[${nodeServer.name}(${nodeServer.profileNum})] :: already running.`)
    return { success: false, error: `already running` }
  }
  if (!VALID_TYPES.includes(nodeServer.type)) {
    logger.error(
      `[${nodeServer.name}(${nodeServer.profileNum})] :: Invalid Type: '${nodeServer.type}', valid types are '${VALID_TYPES}'`
    )
    return { success: false, error: `invalid type` }
  }
  if (!fs.existsSync(nodeServer.home)) {
    logger.error(
      `[${nodeServer.name}(${nodeServer.profileNum})] ::  directory ${nodeServer.home} not found. Skipping.`
    )
    return { success: false, error: `directory not found` }
  }
  try {
    const serverJson = fs.readJSONSync(`${nodeServer.home}/server.json`)
    config.git[nodeServer.id] = git(nodeServer.home)
    logger.info(`[${nodeServer.name}(${nodeServer.profileNum})] :: Checking for update...`)
    const update = await config.git[nodeServer.id].pull()
    if (update && update.summary.changes !== 0) {
      logger.info(
        `[${nodeServer.name}(${nodeServer.profileNum})] :: New Version detected: re-running install process...`
      )
      await installNs(nodeServer, serverJson)
    }
    // Start Child Process
    const init = Buffer.from(
      JSON.stringify({
        uuid: nodeServer.uuid,
        profileNum: nodeServer.profileNum,
        logLevel: nodeServer.logLevel,
        token: nodeServer.token,
        mqttHost: config.globalsettings.mqttHost,
        mqttPort: config.globalsettings.mqttPort,
        secure: config.globalsettings.secure
      })
    ).toString('base64')
    const opts = {
      cwd: nodeServer.home,
      shell: '/bin/sh',
      detached: true,
      env: { ...process.env, PG3INIT: init }
    }
    const runCmd = `/usr/bin/env ${serverJson.type} ./${serverJson.executable}`
    logger.info(
      `[${nodeServer.name}(${nodeServer.profileNum})] :: Starting NodeServer - Version ${serverJson.credits[0].version}`
    )
    const updateObject = {
      timeStarted: `${Date.now()}`
    }
    ;['version', 'executable', 'type', 'logLevel', 'shortPoll', 'longPoll'].map(item => {
      if (utils.isIn(serverJson, item)) updateObject[item] = serverJson[item]
    })
    ns.update(nodeServer.uuid, nodeServer.profileNum, updateObject)
    config.nodeProcesses[nodeServer.id] = childProcess.spawn(runCmd, [], opts)

    // STDERR
    config.nodeProcesses[nodeServer.id].stderr.on('data', data => {
      stopPolls(nodeServer)
      logger.error(`[${nodeServer.name}(${nodeServer.profileNum})] :: STDERR: ${data.toString()}`)
      delete config.nodeProcesses[nodeServer.id]
    })

    // STDOUT
    config.nodeProcesses[nodeServer.id].stdout.on('data', data => {
      logger.debug(`[${nodeServer.name}(${nodeServer.profileNum}]) :: STDOUT: ${data.toString()}`)
    })

    // ERROR
    config.nodeProcesses[nodeServer.id].on('error', err => {
      logger.error(`[${nodeServer.name}(${nodeServer.profileNum})] :: Error: ${err}`)
      if (config.nodeProcesses[nodeServer.id]) {
        stopPolls(nodeServer)
        delete config.nodeProcesses[nodeServer.id]
      }
    })

    // EXIT
    config.nodeProcesses[nodeServer.id].on('exit', (code, signal) => {
      if (config.nodeProcesses[nodeServer.id]) {
        stopPolls(nodeServer)
        delete config.nodeProcesses[nodeServer.id]
      }
      if (nodeServer) {
        logger.debug(
          `[${nodeServer.name}(${nodeServer.profileNum})] :: Exit cause code: ${code} - signal: ${signal}`
        )
      } else {
        logger.debug(`NSChild: NodeServer Shutdown cause code: ${code} signal: ${signal}`)
      }
      ns.update(nodeServer.uuid, nodeServer.profileNum, { timeStarted: 0 })
    })

    // Start polls
    await startPolls(nodeServer)
    return { success: true }
  } catch (err) {
    logger.error(`startNs: ${err.stack}`)
    return { success: false, error: `${err.message}` }
  }
}

// TODO send stop to NS
async function stopNs(nodeServer) {
  if (config.nodeProcesses[nodeServer.id]) {
    logger.info(`[${nodeServer.name}(${nodeServer.profileNum})]: Stopping Nodeserver`)
    stopPolls(nodeServer)
    await nscore.sendMessage(nodeServer.uuid, nodeServer.profileNum, { stop: {} })
    await utils.timeout(2000)
    try {
      process.kill(-config.nodeProcesses[nodeServer.id].pid)
    } catch (err) {
      logger.error(`stopNs: ${err.stack}`)
    }
    return { success: true }
  }
  return { success: false, error: `${nodeServer.name} not running` }
}

async function restartNs(nodeServer) {
  logger.info(`[${nodeServer.name}(${nodeServer.profileNum})]: Restarting Nodeserver`)
  let result = await stopNs(nodeServer)
  if (result.success) {
    await utils.timeout(3000)
    result = { ...(await startNs(nodeServer)) }
  }
  return result
}

async function stopPolls(nodeServer) {
  clearInterval(config.shortPolls[nodeServer.id])
  clearInterval(config.longPolls[nodeServer.id])
  delete config.shortPolls[nodeServer.id]
  delete config.longPolls[nodeServer.id]
}

async function startPolls(nodeServer) {
  if (!config.shortPolls[nodeServer.id]) {
    config.shortPolls[nodeServer.id] = setInterval(() => {
      nscore.sendMessage(nodeServer.uuid, nodeServer.profileNum, { shortPoll: {} })
    }, nodeServer.shortPoll * 1000)
    config.shortPolls[nodeServer.id].unref()
  }
  if (!config.longPolls[nodeServer.id]) {
    config.longPolls[nodeServer.id] = setInterval(() => {
      nscore.sendMessage(nodeServer.uuid, nodeServer.profileNum, { longPoll: {} })
    }, 1 * nodeServer.longPoll * 1000)
    config.longPolls[nodeServer.id].unref()
  }
}

async function getNs(nodeServer) {
  const { uuid, profileNum } = nodeServer
  try {
    const result = await ns.getFull(uuid, profileNum)
    if (result) return result
  } catch (err) {
    logger.error(`getNs: ${err.stack}`)
  }
  return { error: 'Not found' }
}

async function getAllNs() {
  try {
    const result = await ns.getAll()
    if (result) return result
  } catch (err) {
    logger.error(`getAllNs: ${err.stack}`)
  }
  return { error: 'Not found' }
}

async function getNodes(nodeServer) {
  const { uuid, profileNum } = nodeServer
  try {
    const result = await nodes.getAllNodeServer(uuid, profileNum)
    if (result) return result
  } catch (err) {
    logger.error(`getNodes: ${err.stack}`)
  }
  return { error: 'Not found' }
}

async function sendFrontend401(uuid) {
  try {
    await frontendcore.frontendMessage({ invalidCredentials: { uuid } })
  } catch (err) {
    logger.error(`sendFrontend401: ${err.stack}`)
  }
}

async function sendFrontendUpdate() {
  try {
    const result = await getAllNs()
    await frontendcore.frontendMessage({ getNodeServers: result })
  } catch (err) {
    logger.error(`sendFrontendUpdate: ${err.stack}`)
  }
}

async function sendConfig(uuid, profileNum) {
  try {
    const result = await ns.getFull(uuid, profileNum)
    nscore.sendMessage(uuid, profileNum, { config: result })
  } catch (err) {
    logger.error(`sendConfig: ${err.stack}`)
    nscore.sendMessage(uuid, profileNum, { config: {} })
  }
}

// API
module.exports = {
  start,
  stop,
  gitClone,
  gitCheckout,
  createNs,
  installNs,
  removeNs,
  removeAllNs,
  startNs,
  stopNs,
  restartNs,
  stopPolls,
  startPolls,
  getNs,
  getAllNs,
  getNodes,
  sendFrontendUpdate,
  verifyNodeServers,
  sendConfig
}
