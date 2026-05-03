const fs = require('fs')
const path = require('path')

const REPO_DATA_DIR = path.join(__dirname, '../data')
const REPO_LOG_DIR = path.join(__dirname, '../logs')
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : REPO_DATA_DIR
const LOG_DIR = process.env.LOG_DIR
  ? path.resolve(process.env.LOG_DIR)
  : path.join(DATA_DIR, '../logs')

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function ensureSeededFile(targetFile, fallbackFile, defaultContent = '{}\n') {
  ensureDir(path.dirname(targetFile))
  if (fs.existsSync(targetFile)) return

  if (fs.existsSync(fallbackFile)) {
    fs.copyFileSync(fallbackFile, targetFile)
    return
  }

  fs.writeFileSync(targetFile, defaultContent, 'utf-8')
}

module.exports = {
  DATA_DIR,
  LOG_DIR,
  REPO_DATA_DIR,
  REPO_LOG_DIR,
  ensureDir,
  ensureSeededFile,
}
