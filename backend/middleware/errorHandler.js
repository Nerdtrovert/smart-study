const { appendLog } = require('../utils/adminLog')

function mapErrorStatus(err) {
  if (err?.statusCode) return err.statusCode
  if (err?.response?.status) return err.response.status

  const apiError = `${err?.response?.data?.error || ''}`.toLowerCase()
  const description = `${err?.response?.data?.error_description || ''}`.toLowerCase()
  const message = `${err?.message || ''}`.toLowerCase()

  if (
    apiError.includes('invalid_grant') ||
    description.includes('invalid_grant') ||
    message.includes('invalid_grant')
  ) {
    return 503
  }

  return 500
}

function mapErrorMessage(err, status) {
  const apiError = `${err?.response?.data?.error || ''}`.toLowerCase()
  const description = `${err?.response?.data?.error_description || ''}`.toLowerCase()
  const message = `${err?.message || ''}`

  if (
    status === 503 &&
    (apiError.includes('invalid_grant') || description.includes('invalid_grant') || message.toLowerCase().includes('invalid_grant'))
  ) {
    return 'Google Drive authorization failed (invalid_grant). Reconnect Drive by updating GOOGLE_REFRESH_TOKEN (and GOOGLE_REDIRECT_URI if needed).'
  }

  return message || 'Internal server error'
}

module.exports = function errorHandler(err, req, res, next) {
  console.error(err)
  const status = mapErrorStatus(err)
  const publicMessage = mapErrorMessage(err, status)

  appendLog('error', {
    actor: req.admin?.username || 'system',
    actorName: req.admin?.name,
    status: 'failed',
    message: `${req.method} ${req.originalUrl}: ${publicMessage}`
  })
  res.status(status).json({ error: publicMessage })
}
