require('dotenv').config()

const { rebuildCatalogFromDrive } = require('../utils/driveCatalog')

async function main() {
  const summary = await rebuildCatalogFromDrive()
  console.log(JSON.stringify(summary, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
