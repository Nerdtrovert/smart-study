const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')

function getDriveClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON || !process.env.DRIVE_FOLDER_ID) {
    throw new Error('Google Drive upload is not configured')
  }

  let credentials
  try {
    credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON must be valid JSON')
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  })
  return google.drive({ version: 'v3', auth })
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
    fields: 'id, webViewLink'
  })

  return {
    fileId: data.id,
    webViewLink: data.webViewLink
  }
}

async function deleteFromDrive(fileId) {
  const drive = getDriveClient()
  await drive.files.delete({ fileId })
}

module.exports = { getDriveClient, uploadToDrive, deleteFromDrive }
