const { appendLog } = require('../utils/adminLog')

module.exports = function errorHandler(err, req, res, next) {
  console.error(err)
  appendLog('error', {
    actor: req.admin?.username || 'system',
    status: 'failed',
    message: `${req.method} ${req.originalUrl}: ${err.message || 'Internal server error'}`
  })
  res.status(500).json({ error: err.message || 'Internal server error' })
}
