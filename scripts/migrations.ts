import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'

const MIGRATIONS_DIR = './prisma/migrations'
const fileName = `${MIGRATIONS_DIR}/${Date.now()}.sql`

// Create directory if it doesn't exist (to prevent read/write errors)
if (!existsSync(MIGRATIONS_DIR)) {
  mkdirSync(MIGRATIONS_DIR, { recursive: true })
}

const hasMigrations = readdirSync(MIGRATIONS_DIR).some((file) =>
  file.endsWith('.sql'),
)
const fromFlag = hasMigrations ? '--from-config-datasource' : '--from-empty'

const cmd = `npx prisma migrate diff ${fromFlag} --to-schema ./prisma/schema.prisma --script --output ${fileName}`

try {
  console.log(`⏳ Generating migration (${fromFlag})...`)
  execSync(cmd, { stdio: 'inherit' }) // stdio: 'inherit' pipes output to the terminal
  console.log(`\n✅ Migration created successfully: ${fileName}`)
} catch {
  console.error('\n❌ An error occurred while generating the migration.')
  process.exit(1)
}
