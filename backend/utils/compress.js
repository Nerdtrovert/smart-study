const { execFile } = require('child_process')

const GHOSTSCRIPT_COMMANDS = ['gs', 'gswin64c', 'gswin32c']

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
  let lastError

  for (const command of GHOSTSCRIPT_COMMANDS) {
    try {
      return await runGhostscript(command, inputPath, outputPath)
    } catch (err) {
      lastError = err
      if (err.code && err.code !== 'ENOENT') break
    }
  }

  console.warn(`PDF compression skipped: ${lastError?.message || 'Ghostscript unavailable'}`)
  return inputPath
}

module.exports = { compressPDF }
