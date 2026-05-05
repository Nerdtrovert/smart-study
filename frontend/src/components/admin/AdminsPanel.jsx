import '../../styles/Admin.css'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function AdminsPanel({ admin }) {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ name: '', username: '', password: '' })

  const token = localStorage.getItem('admin_token')

  const loadAdmins = async () => {
    try {
      const { data } = await axios.get('/api/admin/admins', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAdmins(data.admins || [])
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load admins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAdmins() }, [])

  const addAdmin = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const { data } = await axios.post('/api/admin/admins', form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setAdmins(current => [...current, data.admin])
      setForm({ name: '', username: '', password: '' })
      setMessage(`Admin ${data.admin.username} created`)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not create admin')
    } finally {
      setSaving(false)
    }
  }

  if (!admin?.isMain) return <p className="admin-empty">Only the main admin can manage admins.</p>
  if (loading) return <p className="admin-empty">Loading admins...</p>

  return (
    <div className="admin-list">
      <section className="batch-upload__header">
        <div>
          <h2 className="batch-upload__title">Create admin</h2>
          <p className="batch-upload__sub">Create admin credentials directly here. Passwords are salted + hashed in backend storage.</p>
        </div>
      </section>

      <form className="admin-create-form" onSubmit={addAdmin}>
        <input
          className="input"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="input"
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit" className="btn btn--green" disabled={saving}>
          {saving ? 'Creating...' : 'Create admin'}
        </button>
      </form>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-empty">{message}</p>}

      <section className="admin-admin-list">
        {admins.map(item => (
          <div key={item.username} className="admin-admin-card">
            <p className="admin-file-card__title">{item.name}</p>
            <p className="admin-file-card__meta">
              @{item.username} · {item.active ? 'Active' : 'Inactive'} · {item.hasPasswordHash ? 'Hashed password' : 'Legacy password'}
            </p>
          </div>
        ))}
      </section>
    </div>
  )
}
