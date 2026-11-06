import 'dotenv/config'
import app from './app.js'
import { connectDatabase } from './config/database.js'

const PORT = process.env.PORT || 3000

async function startServer () {
  try {
    await connectDatabase()

    app.listen(PORT, () => {
      console.log(`[server] listening on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('[server] Startup failed:', error)
    process.exitCode = 1
  }
}

startServer()
