import '../../styles/Admin.css'
import { useEffect, useState } from 'react'
import axios from 'axios'

function EditModal({ file, onClose, onSaved }) {
  const token = localStorage.getItem('admin_token')
  const isNote = file.collection === 'notes'

  const [form, setForm] = useState(
    isNote
      ? { title: file.title || '', subject_code: file.subject_code || file.subject || '', module_number: file.module_number ?? '', semester: file.semester || '' }
      : { subject_code: file.subject_code || '', exam_type: file.exam_type || '', year: file.year || '', paper_number: file.paper_number || '', semester: file.semester || '' }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const kind = isNote ? 'note' : 'pyq'
      const { data } = await axios.patch(`/api/upload/${kind}/${file.id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      onSaved(data.record)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-modal__header">
          <h2 className="edit-modal__title">Edit {isNote ? 'Note' : 'PYQ'}</h2>
          <button type="button" className="edit-modal__close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <form className="edit-modal__form" onSubmit={handleSave}>
          {isNote ? (
            <>
              <label className="edit-modal__label">
                Title
                <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Module 1 – Arrays" />
              </label>
              <div className="edit-modal__row">
                <label className="edit-modal__label">
                  Subject Code
                  <input className="input" value={form.subject_code} onChange={e => setForm({ ...form, subject_code: e.target.value })} placeholder="e.g. BCS401" />
                </label>
                <label className="edit-modal__label">
                  Module #
                  <input className="input" type="number" min="1" max="10" value={form.module_number} onChange={e => setForm({ ...form, module_number: e.target.value })} placeholder="1" />
                </label>
                <label className="edit-modal__label">
                  Semester
                  <input className="input" type="number" min="1" max="8" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} placeholder="4" />
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="edit-modal__row">
                <label className="edit-modal__label">
                  Subject Code
                  <input className="input" value={form.subject_code} onChange={e => setForm({ ...form, subject_code: e.target.value })} placeholder="e.g. BCS401" />
                </label>
                <label className="edit-modal__label">
                  Exam Type
                  <select className="input" value={form.exam_type} onChange={e => setForm({ ...form, exam_type: e.target.value })}>
                    <option value="CIE">CIE</option>
                    <option value="SEE">SEE</option>
                  </select>
                </label>
              </div>
              <div className="edit-modal__row">
                <label className="edit-modal__label">
                  Year
                  <input className="input" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="2024" />
                </label>
                <label className="edit-modal__label">
                  Paper #
                  <input className="input" type="number" value={form.paper_number} onChange={e => setForm({ ...form, paper_number: e.target.value })} placeholder="1" />
                </label>
                <label className="edit-modal__label">
                  Semester
                  <input className="input" type="number" min="1" max="8" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} placeholder="4" />
                </label>
              </div>
            </>
          )}

          {error && <p className="admin-error">{error}</p>}

          <div className="edit-modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--green" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UploadedFilesPanel({ admin }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleting, setDeleting] = useState(false)
  const [editingFile, setEditingFile] = useState(null)

  const token = localStorage.getItem('admin_token')

  const loadFiles = async () => {
    try {
      const { data } = await axios.get('/api/admin/files', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFiles(data.files)
      setError('')
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFiles() }, [])

  const handleSaved = (updatedRecord) => {
    setFiles(current =>
      current.map(f => {
        if (f.id !== updatedRecord.id) return f
        // rebuild the display label
        const isNote = f.collection === 'notes'
        const label = isNote
          ? `${updatedRecord.subject_code || updatedRecord.subject} — ${updatedRecord.title}`
          : `${updatedRecord.subject_code} ${updatedRecord.exam_type}${updatedRecord.year ? ` ${updatedRecord.year}` : ''}`
        return { ...f, ...updatedRecord, label }
      })
    )
    window.dispatchEvent(new Event('smart-study:data-updated'))
  }

  const deleteFile = async (file) => {
    try {
      const kind = file.collection === 'notes' ? 'note' : 'pyq'
      await axios.delete(`/api/upload/${kind}/${file.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFiles(current => current.filter(item => item.id !== file.id))
      setSelectedIds(current => { const next = new Set(current); next.delete(file.id); return next })
      window.dispatchEvent(new Event('smart-study:data-updated'))
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  const deleteSelected = async () => {
    if (!admin?.isMain || selectedIds.size === 0) return
    if (!window.confirm(`Delete ${selectedIds.size} file(s)?`)) return
    setDeleting(true)
    setError('')
    let successCount = 0
    const failedIds = []
    for (const id of selectedIds) {
      const file = files.find(f => f.id === id)
      if (!file) continue
      try {
        const kind = file.collection === 'notes' ? 'note' : 'pyq'
        await axios.delete(`/api/upload/${kind}/${file.id}`, { headers: { Authorization: `Bearer ${token}` } })
        successCount++
      } catch { failedIds.push(id) }
    }
    if (successCount > 0) {
      setFiles(current => current.filter(item => !selectedIds.has(item.id) || failedIds.includes(item.id)))
      window.dispatchEvent(new Event('smart-study:data-updated'))
    }
    if (failedIds.length > 0) setError(`Failed to delete ${failedIds.length} file(s)`)
    else setSelectedIds(new Set())
    setDeleting(false)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === files.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(files.map(f => f.id)))
  }

  const toggleSelect = (id) => {
    setSelectedIds(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  if (loading) return <p className="admin-empty">Loading files...</p>

  return (
    <>
      {editingFile && (
        <EditModal
          file={editingFile}
          onClose={() => setEditingFile(null)}
          onSaved={handleSaved}
        />
      )}

      <section className="admin-list">
        <div className="batch-upload__header">
          <div>
            <h2 className="batch-upload__title">Uploaded files</h2>
            <p className="batch-upload__sub">
              Click <strong>Edit</strong> to rename or fix any metadata. Main admin can also delete files.
            </p>
          </div>
        </div>

        {error && <p className="admin-error">{error}</p>}

        {files.length === 0 ? (
          <p className="admin-empty">No uploaded files yet.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === files.length && files.length > 0}
                    onChange={toggleSelectAll}
                  />
                  Select All
                </label>
                {selectedIds.size > 0 && (
                  <button type="button" className="btn btn--danger" onClick={deleteSelected} disabled={deleting}>
                    {deleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
                  </button>
                )}
              </div>
            <div className="admin-file-list">
              {files.map(file => (
                <div key={`${file.collection}-${file.id}`} className="admin-file-card">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(file.id)}
                    onChange={() => toggleSelect(file.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="admin-file-card__title">{file.label}</p>
                    <p className="admin-file-card__meta">
                      {file.collection.toUpperCase()} · Sem {file.semester} · {file.uploaded_at || 'No date'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button type="button" className="btn btn--ghost" onClick={() => setEditingFile(file)}>
                      ✏️ Edit
                    </button>
                    <button type="button" className="btn btn--danger" onClick={() => deleteFile(file)}>
                        Delete
                      </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}
