const fs = require('fs')
const path = require('path')

const LOG_DIR = path.join(__dirname, '../logs')
const LOG_FILE = path.join(LOG_DIR, 'admin.log')
const LOG_STATE_FILE = path.join(LOG_DIR, 'admin-log-state.json')

function clean(value = '') {
  return `${value}`.replace(/\s+/g, ' ').trim()
}

function resolveActor(details = {}) {
  const actor = clean(details.actor || 'system')
  const actorName = clean(details.actorName || details.name || '')
  if (!actorName) return actor
  if (actorName.toLowerCase() === actor.toLowerCase()) return actorName
  return `${actorName} (${actor})`
}

function currentMonthKey() {
  const now = new Date()
  const month = `${now.getUTCMonth() + 1}`.padStart(2, '0')
  return `${now.getUTCFullYear()}-${month}`
}

function ensureLogFile() {
  fs.mkdirSync(LOG_DIR, { recursive: true })
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '', 'utf-8')
}

function readState() {
  try {
    const raw = fs.readFileSync(LOG_STATE_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeState(monthKey) {
  fs.writeFileSync(
    LOG_STATE_FILE,
    JSON.stringify({ lastResetMonth: monthKey, lastResetAt: new Date().toISOString() }, null, 2),
    'utf-8'
  )
}

function rotateLogMonthly() {
  ensureLogFile()
  const monthKey = currentMonthKey()
  const state = readState()

  if (!state?.lastResetMonth) {
    writeState(monthKey)
    return false
  }

  if (state.lastResetMonth !== monthKey) {
    fs.writeFileSync(LOG_FILE, '', 'utf-8')
    writeState(monthKey)
    return true
  }

  return false
}

function appendLog(event, details = {}) {
  rotateLogMonthly()

  const actor = resolveActor(details)
  const status = clean(details.status || 'info')
  const message = clean(details.message || event)
  const line = `${new Date().toISOString()} | ${actor} | ${event} | ${status} | ${message}\n`

  fs.appendFile(LOG_FILE, line, err => {
    if (err) console.error('Failed to write admin log:', err.message)
  })
}

function getLogFilePath() {
  rotateLogMonthly()
  return LOG_FILE
}

function resetLogs() {
  ensureLogFile()
  fs.writeFileSync(LOG_FILE, '', 'utf-8')
  writeState(currentMonthKey())
}

function getLogSettings() {
  const state = readState()
  return {
    autoReset: 'monthly',
    lastResetMonth: state?.lastResetMonth || null,
    lastResetAt: state?.lastResetAt || null
  }
}

module.exports = { appendLog, getLogFilePath, resetLogs, getLogSettings }
