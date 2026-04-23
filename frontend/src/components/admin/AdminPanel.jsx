import '../../styles/Admin.css'
import { useState, useEffect } from 'react'
import axios from 'axios'
import BatchUploadForm from './BatchUploadForm'
import NotificationsPanel from './NotificationsPanel'
import UploadedFilesPanel from './UploadedFilesPanel'
import LogsPanel from './LogsPanel'

export default function AdminPanel() {
  const [authed, setAuthed] = useState(false)
  const [creds, setCreds] = useState({ username: '', password: '' })
  const [admin, setAdmin] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('upload')

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

  if (!authed) return (
    <div className="admin-login">
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
        <h1 className="admin-header__title">Admin panel</h1>
        <button className="btn btn--ghost" onClick={() => { localStorage.removeItem('admin_token'); setAdmin(null); setAuthed(false) }}>
          Logout
        </button>
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
