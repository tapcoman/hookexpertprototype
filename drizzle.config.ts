import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './server/db/sqlite-schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './database.sqlite',
  },
  verbose: true,
  strict: true,
})