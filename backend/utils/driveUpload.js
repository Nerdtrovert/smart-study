const { google } = require('googleapis')
const fs = require('fs')

function cleanEnvValue(value) {
  if (value === undefined || value === null) return ''
  const trimmed = `${value}`.trim()
  if (!trimmed) return ''

  // Handle values accidentally pasted with wrapping quotes in env providers.
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }

  return trimmed
}

function getDriveClient() {
  const GOOGLE_CLIENT_ID = cleanEnvValue(process.env.GOOGLE_CLIENT_ID)
  const GOOGLE_CLIENT_SECRET = cleanEnvValue(process.env.GOOGLE_CLIENT_SECRET)
  const GOOGLE_REFRESH_TOKEN = cleanEnvValue(process.env.GOOGLE_REFRESH_TOKEN)
  const DRIVE_FOLDER_ID = cleanEnvValue(process.env.DRIVE_FOLDER_ID)
  const GOOGLE_REDIRECT_URI = cleanEnvValue(process.env.GOOGLE_REDIRECT_URI) || 'https://developers.google.com/oauthplayground'

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !DRIVE_FOLDER_ID) {
    throw new Error('Google Drive upload is not configured. Missing OAuth or Folder ID variables.')
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
  })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

async function uploadToDrive(filePath, fileName, metadata = {}) {
  const drive = getDriveClient()

  const appProperties = Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, `${value}`])
  )

  const { data } = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.DRIVE_FOLDER_ID],
      appProperties
    },
    media: {
      mimeType: 'application/pdf',
      body: fs.createReadStream(filePath)
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true
  })

  // Make the file readable by anyone with the link so our proxy can stream it
  // and so students don't need their own Google account
  try {
    await drive.permissions.create({
      fileId: data.id,
      supportsAllDrives: true,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    })
  } catch (permErr) {
    // Non-fatal: log and continue — the proxy will still work via the service account
    console.warn('[driveUpload] Could not set public permission on file:', data.id, permErr.message)
  }

  return {
    fileId: data.id,
    webViewLink: data.webViewLink
  }
}

async function deleteFromDrive(fileId) {
  const drive = getDriveClient()
  await drive.files.delete({ fileId, supportsAllDrives: true })
}

module.exports = { getDriveClient, uploadToDrive, deleteFromDrive }
