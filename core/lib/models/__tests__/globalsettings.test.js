/*
 eslint import/no-dynamic-require: 0
 */
const name = 'globalsettings'
const mod = require(`../${name}`)

describe(`check ${mod} `, () => {
  test(`${name} table should be defined`, () => {
    expect(mod.TABLE).toBeDefined()
  })
  test(`${name} DEFAULTS should be defined`, () => {
    expect(mod.DEFAULTS).toBeDefined()
  })
  test(`${name} get should be defined`, () => {
    expect(mod.get).toBeDefined()
  })
  test(`${name} update should be defined`, () => {
    expect(mod.update).toBeDefined()
  })
})
