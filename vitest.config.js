import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

export default defineConfig(() => {
  const env = config({ path: '.env.test' })

  if (env.error || !env.parsed?.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI in .env.test')
  }

  if (!env.parsed.MONGODB_URI.endsWith('/studymatch_test')) {
    throw new Error('Tests must use studymatch_test')
  }

  process.env.MONGODB_URI = env.parsed.MONGODB_URI

  return {
    test: {
      environment: 'node',
      coverage: {
        provider: 'v8'
      }
    }
  }
})
