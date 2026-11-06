import { MongoClient } from 'mongodb'

let client

export async function connectDatabase () {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error('MONGODB_URI is not defined')
  }

  const newClient = new MongoClient(uri)
  await newClient.connect()
  await newClient.db().collection('users').createIndex({ email: 1 }, { unique: true })
  client = newClient

  console.log('[database] Connected to MongoDB')
  return client.db()
}

export function getDatabase () {
  if (!client) {
    throw new Error('Database is not connected')
  }

  return client.db()
}

export async function closeDatabase () {
  if (client) {
    await client.close()
    client = undefined
    console.log('[database] Connection closed')
  }
}
