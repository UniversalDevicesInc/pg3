const config = require('../config')

describe('check config object', () => {
  test('config should be defined', () => {
    expect(config).toBeDefined()
  })
  test('config should be an object', () => {
    expect(config).toEqual(expect.any(Object))
  })
  test('shutdown should be false', () => {
    expect(config.shutdown).toBe(false)
  })
})
