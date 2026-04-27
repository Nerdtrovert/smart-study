const { execFile } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const GHOSTSCRIPT_COMMANDS = ['gs', 'gswin64c', 'gswin64c.exe', 'gswin32c', 'gswin32c.exe']
let cachedGhostscriptCommand

function getWindowsGhostscriptCandidates() {
  const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']].filter(Boolean)
  const candidates = []

  for (const root of roots) {
    const gsRoot = path.join(root, 'gs')
    if (!fs.existsSync(gsRoot)) continue

    let versions = []
    try {
      versions = fs.readdirSync(gsRoot, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    } catch {
      continue
    }

    for (const version of versions) {
      const binDir = path.join(gsRoot, version, 'bin')
      for (const exe of ['gswin64c.exe', 'gswin32c.exe']) {
        const fullPath = path.join(binDir, exe)
        if (fs.existsSync(fullPath)) candidates.push(fullPath)
      }
    }
  }

  return candidates
}

function getGhostscriptCommands() {
  const commands = []

  if (process.env.GHOSTSCRIPT_PATH) commands.push(process.env.GHOSTSCRIPT_PATH.trim())
  commands.push(...GHOSTSCRIPT_COMMANDS)

  if (os.platform() === 'win32') {
    commands.push(...getWindowsGhostscriptCandidates())
  }

  return [...new Set(commands.filter(Boolean))]
}

function runGhostscript(command, inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    execFile(command, [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/ebook',
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      `-sOutputFile=${outputPath}`,
      inputPath
    ], (err) => {
      if (err) return reject(err)
      resolve(outputPath)
    })
  })
}

async function compressPDF(inputPath) {
  const outputPath = `${inputPath}_compressed.pdf`
  let lastError = null

  const commands = cachedGhostscriptCommand
    ? [cachedGhostscriptCommand, ...getGhostscriptCommands().filter(command => command !== cachedGhostscriptCommand)]
    : getGhostscriptCommands()

  for (const command of commands) {
    try {
      const result = await runGhostscript(command, inputPath, outputPath)
      cachedGhostscriptCommand = command
      return result
    } catch (err) {
      lastError = err
      if (cachedGhostscriptCommand === command && err.code === 'ENOENT') {
        cachedGhostscriptCommand = undefined
      }
      if (err.code && err.code !== 'ENOENT') break
    }
  }

  console.warn(`PDF compression skipped: ${lastError?.message || 'Ghostscript unavailable'}`)
  return inputPath
}

module.exports = { compressPDF }
