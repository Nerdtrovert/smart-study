import '../../styles/Admin.css'
import { useState, useEffect } from 'react'
import axios from 'axios'
import BatchUploadForm from './BatchUploadForm'
import NotificationsPanel from './NotificationsPanel'
import UploadedFilesPanel from './UploadedFilesPanel'
import LogsPanel from './LogsPanel'
import brandLogo from '../../assets/brand-logo.png'

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false)
  const [creds, setCreds] = useState({ username: '', password: '' })
  const [admin, setAdmin] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('upload')
  const [rebuildState, setRebuildState] = useState({ loading: false, message: '', kind: '' })

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) return

    axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setAdmin(data.admin)
        setAuthed(true)
      })
      .catch(() => {
        localStorage.removeItem('admin_token')
        setAuthed(false)
      })
  }, [])

  const login = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.post('/api/auth/login', creds)
      localStorage.setItem('admin_token', data.token)
      setAdmin(data.admin)
      setError(null)
      setAuthed(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials')
    }
  }

  const rebuildCatalog = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) return

    setRebuildState({ loading: true, message: '', kind: '' })
    try {
      const { data } = await axios.post('/api/admin/rebuild-catalog', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const unresolvedCount = data.unresolved?.length || 0
      const message = unresolvedCount > 0
        ? `Restored ${data.restored} files, but ${unresolvedCount} still need manual review.`
        : `Restored ${data.restored} files from Drive.`

      setRebuildState({ loading: false, message, kind: unresolvedCount > 0 ? 'warn' : 'success' })
      window.dispatchEvent(new Event('smart-study:data-updated'))
    } catch (err) {
      setRebuildState({
        loading: false,
        message: err.response?.data?.error || 'Catalog rebuild failed',
        kind: 'error'
      })
    }
  }

  if (!authed) return (
    <div className="admin-login">
      <img src={brandLogo} alt="Smart Study logo" className="admin-login__logo" />
      <h1 className="admin-login__title">Admin</h1>
      <p className="admin-login__sub">Smart Study · Dr. HNNCE</p>
      <form onSubmit={login}>
        <div className="admin-login__field">
          <input className="input" placeholder="Username" value={creds.username}
            onChange={e => setCreds({ ...creds, username: e.target.value })} />
        </div>
        <div className="admin-login__field">
          <input className="input" type="password" placeholder="Password" value={creds.password}
            onChange={e => setCreds({ ...creds, password: e.target.value })} />
        </div>
        <button type="submit" className="btn btn--green" style={{ width: '100%', justifyContent: 'center' }}>Login</button>
      </form>
      {error && <p className="admin-login__error">{error}</p>}
    </div>
  )

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Admin panel</h1>
          {rebuildState.message && (
            <p className={`admin-header__status admin-header__status--${rebuildState.kind}`}>
              {rebuildState.message}
            </p>
          )}
        </div>
        <div className="admin-header__actions">
          {admin?.isMain && (
            <button className="btn btn--blue" onClick={rebuildCatalog} disabled={rebuildState.loading}>
              {rebuildState.loading ? 'Rebuilding...' : 'Rebuild from Drive'}
            </button>
          )}
          <span className="admin-header__user">
            {admin?.name || admin?.username}
          </span>
          <button className="btn btn--ghost" onClick={() => { localStorage.removeItem('admin_token'); setAdmin(null); setAuthed(false) }}>
            Logout
          </button>
        </div>
      </div>
      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'upload' ? 'admin-tab--active' : ''}`} onClick={() => setTab('upload')}>
          Upload
        </button>
        <button className={`admin-tab ${tab === 'requests' ? 'admin-tab--active' : ''}`} onClick={() => setTab('requests')}>
          Requests
        </button>
        <button className={`admin-tab ${tab === 'files' ? 'admin-tab--active' : ''}`} onClick={() => setTab('files')}>
          Files
        </button>
        {admin?.isMain && (
          <button className={`admin-tab ${tab === 'logs' ? 'admin-tab--active' : ''}`} onClick={() => setTab('logs')}>
            Logs
          </button>
        )}
      </div>
      {tab === 'upload' && <BatchUploadForm />}
      {tab === 'requests' && <NotificationsPanel />}
      {tab === 'files' && <UploadedFilesPanel admin={admin} />}
      {tab === 'logs' && <LogsPanel admin={admin} />}
    </div>
  )
}
