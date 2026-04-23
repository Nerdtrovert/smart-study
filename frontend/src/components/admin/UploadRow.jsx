import { BRANCHES } from '../../data/branches'
const NOTE_TYPES = [
  { value: 'module', label: 'Module' },
  { value: 'syllabus', label: 'Syllabus' },
]
const EXAM_TYPES = [
  { value: 'CIE1', label: 'CIE 1' },
  { value: 'CIE2', label: 'CIE 2' },
  { value: 'CIE3', label: 'CIE 3' },
  { value: 'SEE', label: 'PYQ / SEE' },
]

export default function UploadRow({ row, onChange, onRemove }) {
  const update = (updates) => onChange(row.id, updates)
  const isNotes = row.type === 'notes'
  const isSEE = row.exam_type === 'SEE'

  return (
    <tr className={`upload-row row--${row.status}`}>
      <td>
        <select
          className="select upload-row__control"
          value={row.type}
          onChange={e => update({ type: e.target.value })}
        >
          <option value="notes">Notes</option>
          <option value="pyqs">PYQs</option>
        </select>
      </td>
      <td>
        <select
          className="select upload-row__control"
          value={row.semester}
          onChange={e => update({ semester: e.target.value })}
        >
          <option value="">Sem</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>
      <td>
        {isNotes ? (
          <select
            className="select upload-row__control"
            value={row.branch}
            onChange={e => update({ branch: e.target.value })}
          >
            {BRANCHES.map(branch => <option key={branch} value={branch}>{branch}</option>)}
          </select>
        ) : (
          <span className="batch-table__status">—</span>
        )}
      </td>
      <td>
        <input
          className="input upload-row__course"
          placeholder="Course code"
          value={row.subject_code}
          onChange={e => update({ subject_code: e.target.value.toUpperCase() })}
        />
      </td>
      <td>
        {isNotes ? (
          <div className="upload-row__stack">
            <select
              className="select upload-row__control"
              value={row.note_type}
              onChange={e => update({ note_type: e.target.value })}
            >
              {NOTE_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
            {row.note_type === 'module' && (
              <input
                className="input upload-row__small"
                type="number"
                min="1"
                placeholder="Module"
                value={row.module_number}
                onChange={e => update({ module_number: e.target.value })}
              />
            )}
          </div>
        ) : (
          <div className="upload-row__stack">
            <select
              className="select upload-row__control"
              value={row.exam_type}
              onChange={e => update({ exam_type: e.target.value })}
            >
              {EXAM_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
            {isSEE && (
              <>
                <input
                  className="input upload-row__small"
                  type="number"
                  placeholder="Year"
                  value={row.year}
                  onChange={e => update({ year: e.target.value })}
                />
                <input
                  className="input upload-row__small"
                  type="number"
                  min="1"
                  placeholder="Paper"
                  value={row.paper_number}
                  onChange={e => update({ paper_number: e.target.value })}
                />
              </>
            )}
          </div>
        )}
      </td>
      <td>
        <label className="upload-row__file">
          <input type="file" accept="application/pdf,.pdf" onChange={e => update({ file: e.target.files[0] || null })} />
          <span>{row.file?.name || 'Choose PDF'}</span>
        </label>
      </td>
      <td>
        <span className={`batch-table__status batch-table__status--${row.status}`}>
          {row.error || row.status}
        </span>
      </td>
      <td>
        <button type="button" className="btn btn--danger upload-row__remove" onClick={() => onRemove(row.id)}>
          Remove
        </button>
      </td>
    </tr>
  )
}
