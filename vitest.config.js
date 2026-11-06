import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

export default defineConfig(() => {
  if (!process.env.MONGODB_URI) {
    config({ path: '.env.test' })
  }

  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('Missing MONGODB_URI. Set it or create .env.test')
  }

  if (!uri.endsWith('/studymatch_test')) {
    throw new Error('Tests must use studymatch_test')
  }

  return {
    test: {
      environment: 'node',
      coverage: {
        provider: 'v8'
      }
    }
  }
})
