import request from 'supertest'
import app from '../src/app.js'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { connectDatabase, getDatabase, closeDatabase } from '../src/config/database.js'

describe('POST /api/auth/register', () => {
  beforeAll(async () => {
    if (!process.env.MONGODB_URI?.endsWith('/studymatch_test')) {
      throw new Error('Tests must use studymatch_test')
    }

    await connectDatabase()
    await getDatabase().collection('users').createIndex(
      { email: 1 },
      { unique: true }
    )
  })

  beforeEach(async () => {
    await getDatabase().collection('users').deleteMany({
      email: /^stud6-test-/
    })
  })

  afterAll(async () => {
    await getDatabase().collection('users').deleteMany({
      email: /^stud6-test-/
    })
    await closeDatabase()
  })

  it('creates an account and hashes the password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice',
        email: 'stud6-test-alice@example.com',
        password: 'TestPassword123!'
      })

    expect(res.status).toBe(201)
    expect(res.body.message).toBe('Account created successfully')
    expect(res.body.email).toBe('stud6-test-alice@example.com')
    expect(res.body).toHaveProperty('userId')
    expect(res.body).not.toHaveProperty('password')
    expect(res.body).not.toHaveProperty('passwordHash')

    const user = await getDatabase().collection('users').findOne({
      email: 'stud6-test-alice@example.com'
    })

    expect(user).not.toBeNull()
    expect(user.passwordHash).not.toBe('TestPassword123!')
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/)
  })

  it('rejects registration without password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice',
        email: 'stud6-test-alice@example.com'
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('All fields are required')
  })

  it('rejects invalid email addresses', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice',
        email: 'alicegmail.com',
        password: 'TestPassword123!'
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Invalid email address')
  })

  it('rejects duplicate email addresses', async () => {
    const data = {
      name: 'Alice',
      email: 'stud6-test-duplicate@example.com',
      password: 'TestPassword123!'
    }

    const first = await request(app)
      .post('/api/auth/register')
      .send(data)

    const second = await request(app)
      .post('/api/auth/register')
      .send(data)

    expect(first.status).toBe(201)
    expect(second.status).toBe(409)
    expect(second.body.error).toBe('Email already registered')
  })
})
