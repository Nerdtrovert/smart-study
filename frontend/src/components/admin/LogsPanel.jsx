import '../../styles/Admin.css'
import { useState } from 'react'
import axios from 'axios'

export default function LogsPanel({ admin }) {
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const downloadDataFile = async (name) => {
    const token = localStorage.getItem('admin_token')

    try {
      const { data } = await axios.get(`/api/admin/data/${name}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = `smart-study-${name}.json`
      link.click()
      URL.revokeObjectURL(url)
      setError('')
      setMessage('')
    } catch (err) {
      setError(err.response?.data?.error || `Could not download ${name}.json`)
    }
  }

  const downloadLogs = async () => {
    const token = localStorage.getItem('admin_token')

    try {
      const { data } = await axios.get('/api/admin/logs/download', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = 'smart-study-admin.log'
      link.click()
      URL.revokeObjectURL(url)
      setError('')
      setMessage('')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not download logs')
    }
  }

  const resetLogs = async () => {
    const token = localStorage.getItem('admin_token')
    try {
      await axios.post('/api/admin/logs/reset', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setError('')
      setMessage('Logs reset. They also auto-reset monthly.')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset logs')
      setMessage('')
    }
  }

  if (!admin?.isMain) {
    return <p className="admin-empty">Only the main admin can download logs.</p>
  }

  return (
    <div className="admin-list">
      <section className="batch-upload__header">
        <div>
          <h2 className="batch-upload__title">Admin logs</h2>
          <p className="batch-upload__sub">Download the live text log of logins, uploads, deletes, and errors. Logs auto-reset monthly.</p>
          {error && <p className="admin-error">{error}</p>}
          {message && <p className="admin-empty">{message}</p>}
        </div>
        <div className="logs-panel__actions">
          <button type="button" className="btn btn--ghost" onClick={resetLogs}>
            Reset now
          </button>
          <button type="button" className="btn btn--green" onClick={downloadLogs}>
            Download logs
          </button>
        </div>
      </section>

      <section className="batch-upload__header">
        <div>
          <h2 className="batch-upload__title">Persistent data</h2>
          <p className="batch-upload__sub">Download the live JSON files currently stored in persistent backend storage.</p>
        </div>
        <div className="logs-panel__actions">
          <button type="button" className="btn btn--ghost" onClick={() => downloadDataFile('requests')}>
            Download requests
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => downloadDataFile('pyqs')}>
            Download pyqs
          </button>
          <button type="button" className="btn btn--blue" onClick={() => downloadDataFile('notes')}>
            Download notes
          </button>
        </div>
      </section>
    </div>
  )
}
