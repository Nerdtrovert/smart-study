const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')

function getDriveClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, DRIVE_FOLDER_ID } = process.env

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !DRIVE_FOLDER_ID) {
    throw new Error('Google Drive upload is not configured. Missing OAuth or Folder ID variables.')
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Common redirect URI used for generating tokens
  )

  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN
  })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

async function uploadToDrive(filePath, fileName) {
  const drive = getDriveClient()

  const { data } = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [process.env.DRIVE_FOLDER_ID]
    },
    media: {
      mimeType: 'application/pdf',
      body: fs.createReadStream(filePath)
    },
    fields: 'id, webViewLink',
    supportsAllDrives: true
  })

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
