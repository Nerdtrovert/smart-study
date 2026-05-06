const express = require('express')
const cors = require('cors')
const path = require('path')
const compression = require('compression')

const notesRouter    = require('./routes/notes')
const pyqsRouter     = require('./routes/pyqs')
const requestsRouter = require('./routes/requests')
const uploadRouter   = require('./routes/upload')
const authRouter     = require('./routes/auth')
const filesRouter    = require('./routes/files')
const adminRouter    = require('./routes/admin')
const errorHandler   = require('./middleware/errorHandler')

const app = express()
app.use(cors())
app.use(compression())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' })
})

app.use('/api/notes',    notesRouter)
app.use('/api/pyqs',     pyqsRouter)
app.use('/api/requests', requestsRouter)
app.use('/api/upload',   uploadRouter)
app.use('/api/auth',     authRouter)
app.use('/api/files',    filesRouter)
app.use('/api/admin',    adminRouter)

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend/dist')
const frontendIndexPath = path.join(frontendPath, 'index.html')
app.use(express.static(frontendPath, { index: false }))

// SPA fallback: serve index.html for all non-API routes
app.get(/^(?!\/api(?:\/|$)).*/, (req, res, next) => {
  res.sendFile(frontendIndexPath, err => {
    if (err) next(err)
  })
})

app.use(errorHandler)

module.exports = app
