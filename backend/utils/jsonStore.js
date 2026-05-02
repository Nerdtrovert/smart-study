const fs = require('fs').promises
const path = require('path')

const DATA_DIR = path.join(__dirname, '../data')
const collectionLocks = new Map()

function withCollectionLock(name, action) {
  const current = (collectionLocks.get(name) || Promise.resolve()).catch(() => undefined)
  let releaseLock
  const turn = new Promise(resolve => { releaseLock = resolve })
  const queueTail = current.then(() => turn)
  collectionLocks.set(name, queueTail)

  return current
    .then(action)
    .finally(() => {
      releaseLock()
      if (collectionLocks.get(name) === queueTail) collectionLocks.delete(name)
    })
}

async function readJSON(name) {
  try {
    const file = path.join(DATA_DIR, `${name}.json`)
    const raw = await fs.readFile(file, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    throw new Error(`[jsonStore:${name}] ${err.message}`)
  }
}

async function writeJSON(name, data) {
  try {
    const file = path.join(DATA_DIR, `${name}.json`)
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    throw new Error(`[jsonStore:${name}] ${err.message}`)
  }
}

async function mutateJSON(name, mutator) {
  return withCollectionLock(name, async () => {
    const data = await readJSON(name)
    const result = await mutator(data)
    await writeJSON(name, data)
    return result
  })
}

// Atomically append one record to the array inside name.json
async function appendRecord(name, record) {
  return mutateJSON(name, data => {
    const key = name  // 'notes' | 'pyqs' | 'requests'
    data[key].push(record)
    return data
  })
}

async function removeRecord(name, id) {
  return mutateJSON(name, data => {
    const key = name
    const records = data[key]
    const record = records.find(item => item.id === id)

    if (!record) return null

    data[key] = records.filter(item => item.id !== id)
    return record
  })
}

async function updateRecord(name, id, fields) {
  return mutateJSON(name, data => {
    const key = name
    const idx = data[key].findIndex(item => item.id === id)
    if (idx === -1) return null
    data[key][idx] = { ...data[key][idx], ...fields }
    return data[key][idx]
  })
}

module.exports = { readJSON, writeJSON, appendRecord, removeRecord, updateRecord }
