const { readJSON } = require('./jsonStore')

async function findAdmin(username = '', password = '') {
  const cleanUsername = username.trim()

  if (
    cleanUsername === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    return {
      username: cleanUsername,
      role: 'main_admin',
      isMain: true,
      canDelete: true
    }
  }

  const data = await readJSON('admins')
  const admin = data.admins.find(user => (
    user.username === cleanUsername &&
    user.password === password &&
    user.active !== false
  ))

  if (!admin) return null

  return {
    username: admin.username,
    role: 'admin',
    isMain: false,
    canDelete: false
  }
}

module.exports = { findAdmin }
