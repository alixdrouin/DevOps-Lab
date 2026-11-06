import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../../src/utils/password.js'

describe('Password security', () => {
  it('hashes and verifies a password', async () => {
    const password = 'TestPassword123!'

    const hash = await hashPassword(password)

    expect(hash).not.toBe(password)
    expect(await verifyPassword(password, hash)).toBe(true)
    expect(await verifyPassword('WrongPassword', hash)).toBe(false)
  })
})
