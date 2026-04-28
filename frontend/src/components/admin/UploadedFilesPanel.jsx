import '../../styles/Admin.css'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function UploadedFilesPanel({ admin }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleting, setDeleting] = useState(false)

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

  useEffect(() => {
    loadFiles()
  }, [])

  const deleteFile = async (file) => {
    if (!admin?.isMain) return

    try {
      const kind = file.collection === 'notes' ? 'note' : 'pyq'
      await axios.delete(`/api/upload/${kind}/${file.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFiles(current => current.filter(item => item.id !== file.id))
      setSelectedIds(current => {
        const next = new Set(current)
        next.delete(file.id)
        return next
      })
      window.dispatchEvent(new Event('smart-study:data-updated'))
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  const deleteSelected = async () => {
    if (!admin?.isMain || selectedIds.size === 0) return
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} file(s)?`)) return

    setDeleting(true)
    setError('')
    
    let successCount = 0
    const failedIds = []

    for (const id of selectedIds) {
      const file = files.find(f => f.id === id)
      if (!file) continue
      try {
        const kind = file.collection === 'notes' ? 'note' : 'pyq'
        await axios.delete(`/api/upload/${kind}/${file.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        successCount++
      } catch (err) {
        failedIds.push(file.id)
      }
    }

    if (successCount > 0) {
      setFiles(current => current.filter(item => !selectedIds.has(item.id) || failedIds.includes(item.id)))
      window.dispatchEvent(new Event('smart-study:data-updated'))
    }
    
    if (failedIds.length > 0) {
      setError(`Failed to delete ${failedIds.length} file(s)`)
    } else {
      setSelectedIds(new Set())
    }
    
    setDeleting(false)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(files.map(f => f.id)))
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(current => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) return <p className="admin-empty">Loading files...</p>

  return (
    <section className="admin-list">
      <div className="batch-upload__header">
        <div>
          <h2 className="batch-upload__title">Uploaded files</h2>
          <p className="batch-upload__sub">
            Main admin can delete files from Drive and remove their JSON records. Other admins can view this list only.
          </p>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {files.length === 0 ? (
        <p className="admin-empty">No uploaded files yet.</p>
      ) : (
        <>
          {admin?.isMain && (
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
                <button 
                  type="button" 
                  className="btn btn--danger" 
                  onClick={deleteSelected}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
                </button>
              )}
            </div>
          )}
          <div className="admin-file-list">
          {files.map(file => (
            <div key={`${file.collection}-${file.id}`} className="admin-file-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {admin?.isMain && (
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(file.id)}
                  onChange={() => toggleSelect(file.id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              )}
              <div style={{ flex: 1 }}>
                <p className="admin-file-card__title">{file.label}</p>
                <p className="admin-file-card__meta">
                  {file.collection.toUpperCase()} · Sem {file.semester} · {file.uploaded_at || 'No date'}
                </p>
              </div>
              {admin?.isMain && (
                <button type="button" className="btn btn--danger" onClick={() => deleteFile(file)}>
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
        </>
      )}
    </section>
  )
}
