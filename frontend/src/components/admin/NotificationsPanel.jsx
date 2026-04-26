import '../../styles/Admin.css'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function NotificationsPanel() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    axios.get('/api/requests', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setRequests([...data.requests].reverse()))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="admin-muted">Loading requests...</p>
  if (requests.length === 0) return <p className="admin-muted">No requests yet.</p>

  return (
    <div className="notifications">
      {requests.map(r => (
        <div key={r.id} className="notification-card">
          <div className="notification-card__header">
            <span className="notification-card__subject">{r.subject}</span>
            <span className="notification-card__sem">Sem {r.semester}</span>
          </div>
          {r.message && <p className="notification-card__message">{r.message}</p>}
          <p className="notification-card__date">{new Date(r.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      ))}
    </div>
  )
}
