import { useState } from 'react'
import axios from 'axios'

export default function RequestBox() {
  const [form, setForm] = useState({ subject: '', semester: '', message: '' })
  const [status, setStatus] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/requests', form)
      setStatus('success')
      setForm({ subject: '', semester: '', message: '' })
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="requests" className="request-box">
      <p className="request-box__title">Can't find what you need?</p>
      <form onSubmit={handleSubmit}>
        <div className="request-box__row">
          <input className="input" placeholder="Course name with VTU scheme" value={form.subject}
            onChange={e => setForm({ ...form, subject: e.target.value })} required />
          <select className="select" value={form.semester}
            onChange={e => setForm({ ...form, semester: e.target.value })} required>
            <option value="">Semester</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <textarea className="input input--textarea" placeholder="Any extra context or just ideas you have for us?"
          value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
        <div className="request-box__footer">
          <button type="submit" className="btn btn--green">Request notes</button>
        </div>
      </form>
      {status === 'success' && <p className="request-box__status request-box__status--success">Request sent!</p>}
      {status === 'error' && <p className="request-box__status request-box__status--error">Something went wrong. Try again.</p>}
    </section>
  )
}
