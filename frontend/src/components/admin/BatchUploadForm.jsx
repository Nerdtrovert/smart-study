import '../../styles/Admin.css'
import { useMemo, useState } from 'react'
import axios from 'axios'
import UploadRow from './UploadRow'
import { useNotes } from '../../hooks/useNotes'
import { usePYQs } from '../../hooks/usePYQs'
import { BRANCHES } from '../../data/branches'
import catalog from '../../data/courseCodes.json'

function normalizeCourseCode(value = '') {
  return `${value}`.trim().toUpperCase()
}

const emptyRow = () => ({
  id: Date.now() + Math.random(),
  file: null,
  type: 'notes',
  semester: '',
  branch: BRANCHES[0],
  subject_code: '',
  note_type: 'module',
  module_number: '',
  exam_type: 'PYQ',
  status: 'idle',
  error: '',
})

function validateRow(row) {
  if (!row.file) return 'PDF required'
  if (!row.semester) return 'Sem required'
  if (!row.subject_code.trim()) return 'Course code required'

  if (row.type === 'notes') {
    if (!row.branch) return 'Branch required'
    if (row.note_type === 'module' && !row.module_number) return 'Module required'
    return null
  }

  if ((row.exam_type === 'SEE' || row.exam_type === 'PYQ') && !row.year) return 'Year required'
  if ((row.exam_type === 'SEE' || row.exam_type === 'PYQ') && !row.paper_number) return 'Paper required'
  return null
}

export default function BatchUploadForm() {
  const [rows, setRows] = useState([emptyRow()])
  const [uploading, setUploading] = useState(false)
  const { notes, loading: notesLoading } = useNotes()
  const { pyqs, loading: pyqsLoading } = usePYQs()

  const missingCodes = useMemo(() => {
    const knownCodes = new Set(
      Object.keys(catalog.courseCodes || {})
        .map(normalizeCourseCode)
        .filter(Boolean)
    )

    const uploadedCodes = new Set(
      [...notes, ...pyqs]
        .map(record => normalizeCourseCode(record.subject_code))
        .filter(Boolean)
    )

    return [...uploadedCodes]
      .filter(code => !knownCodes.has(code))
      .sort((a, b) => a.localeCompare(b))
  }, [notes, pyqs])

  const updateRow = (id, updates) => {
    setRows(current => current.map(row => row.id === id ? { ...row, ...updates, error: '' } : row))
  }

  const addRow = () => setRows(current => [...current, emptyRow()])
  const removeRow = (id) => setRows(current => current.length === 1 ? current : current.filter(row => row.id !== id))

  const setRowStatus = (id, status, error = '') => {
    setRows(current => current.map(row => row.id === id ? { ...row, status, error } : row))
  }

  const handleUploadAll = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) return

    setUploading(true)

    for (const row of rows) {
      if (row.status === 'done') {
        continue
      }
      const validationError = validateRow(row)
      if (validationError) {
        setRowStatus(row.id, 'error', validationError)
        continue
      }

      setRowStatus(row.id, 'uploading')

      try {
        const formData = new FormData()
        Object.entries(row).forEach(([key, value]) => {
          if (!['id', 'status', 'error'].includes(key) && value !== null && value !== '') {
            formData.append(key, value)
          }
        })

        const endpoint = row.type === 'notes' ? '/api/upload/note' : '/api/upload/pyq'
        await axios.post(endpoint, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })

        setRowStatus(row.id, 'done')
        window.dispatchEvent(new Event('smart-study:data-updated'))

        setTimeout(() => {
          setRows(current => {
            const filtered = current.filter(r => r.id !== row.id)
            return filtered.length === 0 ? [emptyRow()] : filtered
          })
        }, 5000)
      } catch (err) {
        setRowStatus(row.id, 'error', err.response?.data?.error || 'Upload failed')
      }
    }

    setUploading(false)
  }

  return (
    <section className="batch-upload">
      <div className="batch-upload__header">
        <div>
          <h2 className="batch-upload__title">Bulk upload</h2>
          <p className="batch-upload__sub">Enter semester, branch (for notes), course code, paper/module details, and the PDF. Reuse one course code across multiple files for faster batch uploads.</p>
        </div>
        <button type="button" className="btn btn--ghost" onClick={addRow}>
          Add row
        </button>
      </div>

      <div className="catalog-health">
        <p className="catalog-health__title">Course label source: `src/data/courseCodes.json`</p>
        <p className="catalog-health__sub">Upload needs only course code. Add code-name mapping in this file to show <strong>CODE - Name</strong> in Notes/Questions.</p>
        {notesLoading || pyqsLoading ? (
          <p className="catalog-health__status">Checking uploaded codes...</p>
        ) : missingCodes.length > 0 ? (
          <>
            <p className="catalog-health__status catalog-health__status--warn">
              Missing mappings for {missingCodes.length} code{missingCodes.length !== 1 ? 's' : ''}:
            </p>
            <div className="catalog-health__chips">
              {missingCodes.map(code => (
                <span key={code} className="catalog-health__chip">{code}</span>
              ))}
            </div>
          </>
        ) : (
          <p className="catalog-health__status catalog-health__status--ok">All uploaded codes have course-name mappings.</p>
        )}
      </div>

      <div className="batch-table-wrapper">
        <table className="batch-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Sem</th>
              <th>Branch</th>
              <th>Course code</th>
              <th>Module / Paper</th>
              <th>PDF</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <UploadRow key={row.id} row={row} onChange={updateRow} onRemove={removeRow} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="batch-actions">
        <button type="button" className="btn btn--green" onClick={handleUploadAll} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload all'}
        </button>
      </div>
    </section>
  )
}
