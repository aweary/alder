const child_process = require('child_process')
const path = require('path')

const alder = path.resolve(__dirname, './../alder.js')


const execute = (args, cb) => {
  child_process.exec(`${alder} fixtures ${args}`, {}, (err, stdout, stderr) => {
    if (err) {
      throw err
    }
    expect(stdout).toMatchSnapshot()
    typeof cb !== 'undefined' && cb()
  })
}

describe('alder', () => {
  it(`works with 0 arguments/flags`, (done) => {
    execute(``, done)
  })

  it(`only renders the tree to a depth of 1`, (done) => {
    execute(`--depth 1`, done) && execute(`-d 1`, done)
  })

  it(`only prints directories`, (done) => {
    execute(`-D`, done) && execute(`--directories`, done)
  })

  it(`excludes files matching pattern (bar)`, (done) => {
    execute(`-e bar`, done) && execute(`--exclude bar`, done)
  })

  it(`prints the full path prefix for each file`, (done) => {
    execute(`-f`, done) && execute(`--full`, done)
  })

  it(`will not print indentation lines`, (done) => {
    execute(`-i`, done) && execute(`--no-indent`, done)
  })

  it(`ignores files listed in .gitignore (foo folder)`, (done) => {
    execute(`-I`, done) && execute(`--git-ignore`, done)
  })

  it(`will only show files matching pattern (foo)`, (done) => {
    execute(`-p foo`, done) && execute(`--include foo`, done)
  })

  it(`shows file size in tree`, (done) => {
    execute(`-s`, done) && execute(`--sizes`, done)
  })

  it(`prints the last modified date for each file`, (done) => {
    execute(`-t`, done) && execute(`--time-stamp`, done)
  })

  it(`prunes empty directories from output`, (done) => {
    execute(`--prune`, done)
  })

  it(`only descends directories with <2 files`, (done) => {
    execute(`--filelimit 2`, done)
  })

  it(`makes everything all jsxexy`, (done) => {
    execute(`--jsx`, done)
  })
})
