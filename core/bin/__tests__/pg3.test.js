const { start, shutdown, gracefulShutdown, createPid, removePid } = require('./pg3')

describe('check required functions exist', () => {
  test('check start exists', () => {
    expect(start).toBeDefined()
  })
  test('check shutdown exists', () => {
    expect(shutdown).toBeDefined()
  })
  test('check gracefulShutdown exists', () => {
    expect(gracefulShutdown).toBeDefined()
  })
  test('check createPid exists', () => {
    expect(createPid).toBeDefined()
  })
  test('check removePid exists', () => {
    expect(removePid).toBeDefined()
  })
})
