const bcrypt = require('bcryptjs')
const { readJSON, mutateJSON } = require('./jsonStore')

function clean(value = '') {
  return `${value}`.trim()
}

function toAdminPayload(admin = {}) {
  return {
    username: admin.username,
    name: admin.name || admin.username,
    role: admin.isMain ? 'main_admin' : 'admin',
    isMain: Boolean(admin.isMain),
    canDelete: Boolean(admin.isMain),
  }
}

async function verifyMainAdmin(cleanUsername, password) {
  const envUsername = clean(process.env.ADMIN_USER)
  if (!envUsername || cleanUsername !== envUsername) return null

  const envHash = clean(process.env.ADMIN_PASS_HASH)
  const envPlain = `${process.env.ADMIN_PASS || ''}`
  const matched = envHash
    ? await bcrypt.compare(password, envHash)
    : password === envPlain

  if (!matched) return null

  const mainAdminName = clean(process.env.ADMIN_NAME || cleanUsername) || 'Main Admin'
  return toAdminPayload({ username: cleanUsername, name: mainAdminName, isMain: true })
}

async function verifyRegularAdmin(cleanUsername, password) {
  const data = await readJSON('admins')
  const admins = Array.isArray(data.admins) ? data.admins : []
  const admin = admins.find(user => user.username === cleanUsername && user.active !== false)

  if (!admin) return null

  if (admin.passwordHash) {
    const ok = await bcrypt.compare(password, admin.passwordHash)
    return ok ? toAdminPayload({ ...admin, isMain: false }) : null
  }

  if (admin.password && admin.password === password) {
    const passwordHash = await bcrypt.hash(password, 12)
    await mutateJSON('admins', state => {
      const records = Array.isArray(state.admins) ? state.admins : []
      const idx = records.findIndex(user => user.username === cleanUsername)
      if (idx >= 0) {
        records[idx] = { ...records[idx], passwordHash }
        delete records[idx].password
      }
    })
    return toAdminPayload({ ...admin, isMain: false })
  }

  return null
}

async function findAdmin(username = '', password = '') {
  const cleanUsername = clean(username)
  const cleanPassword = `${password || ''}`

  if (!cleanUsername || !cleanPassword) return null

  const main = await verifyMainAdmin(cleanUsername, cleanPassword)
  if (main) return main

  return verifyRegularAdmin(cleanUsername, cleanPassword)
}

async function listAdmins() {
  const data = await readJSON('admins')
  const admins = Array.isArray(data.admins) ? data.admins : []

  return admins.map(admin => ({
    username: admin.username,
    name: admin.name || admin.username,
    active: admin.active !== false,
    hasPasswordHash: Boolean(admin.passwordHash),
  }))
}

async function createAdmin({ username = '', password = '', name = '' }) {
  const cleanUsername = clean(username)
  const cleanName = clean(name) || cleanUsername
  const cleanPassword = `${password || ''}`

  if (!cleanUsername || !cleanPassword) {
    const err = new Error('username and password are required')
    err.statusCode = 400
    throw err
  }

  if (cleanUsername === clean(process.env.ADMIN_USER)) {
    const err = new Error('Username is reserved for main admin')
    err.statusCode = 409
    throw err
  }

  const passwordHash = await bcrypt.hash(cleanPassword, 12)

  const created = await mutateJSON('admins', data => {
    const admins = Array.isArray(data.admins) ? data.admins : []
    if (admins.some(admin => admin.username === cleanUsername)) {
      const err = new Error('Admin username already exists')
      err.statusCode = 409
      throw err
    }

    const adminRecord = {
      username: cleanUsername,
      name: cleanName,
      passwordHash,
      active: true,
      created_at: new Date().toISOString(),
    }

    admins.push(adminRecord)
    data.admins = admins

    return {
      username: adminRecord.username,
      name: adminRecord.name,
      active: adminRecord.active,
      hasPasswordHash: true,
    }
  })

  return created
}

module.exports = { findAdmin, listAdmins, createAdmin }
