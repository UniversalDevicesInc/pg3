/*
 eslint import/no-dynamic-require: 0
 */
const name = 'secure'
const mod = require(`../${name}`)

describe(`check ${mod} `, () => {
  test(`${name} TABLE should be defined`, () => {
    expect(mod.TABLE).toBeDefined()
  })
  test(`${name} DEFAULTS should be defined`, () => {
    expect(mod.DEFAULTS).toBeDefined()
  })
  test(`${name} get should be defined`, () => {
    expect(mod.get).toBeDefined()
  })
  test(`${name} add should be defined`, () => {
    expect(mod.add).toBeDefined()
  })
  test(`${name} update should be defined`, () => {
    expect(mod.update).toBeDefined()
  })
  test(`${name} remove should be defined`, () => {
    expect(mod.remove).toBeDefined()
  })
})
