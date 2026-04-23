import '../../styles/Admin.css'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function UploadedFilesPanel({ admin }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      window.dispatchEvent(new Event('smart-study:data-updated'))
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
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
        <div className="admin-file-list">
          {files.map(file => (
            <div key={`${file.collection}-${file.id}`} className="admin-file-card">
              <div>
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
      )}
    </section>
  )
}
