const BRANCHES = ['CSE/ISE', 'ECE', 'AI&DS', 'Common']

const BRANCH_CANONICAL = {
  'CSE/ISE': 'CSE/ISE',
  ECE: 'ECE',
  'AI&DS': 'AI&DS',
  COMMON: 'Common',
  CSE: 'CSE/ISE',
  ISE: 'CSE/ISE',
}

function normalizeBranch(value = '') {
  const normalized = `${value}`.trim().toUpperCase()
  return BRANCH_CANONICAL[normalized] || normalized
}

function isValidBranch(value = '') {
  return BRANCHES.includes(normalizeBranch(value))
}

function getBranchOptions() {
  return [...BRANCHES]
}

module.exports = {
  normalizeBranch,
  isValidBranch,
  getBranchOptions,
}
