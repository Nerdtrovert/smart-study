const BRANCH_CANONICAL = {
  'CSE/ISE': 'CSE/ISE',
  ECE: 'ECE',
  'AI&DS': 'AI&DS',
  COMMON: 'Common',
  CSE: 'CSE/ISE',
  ISE: 'CSE/ISE',
}

export function normalizeBranch(value = '') {
  const normalized = `${value}`.trim().toUpperCase()
  return BRANCH_CANONICAL[normalized] || normalized
}
