const child_process = require('child_process')

const execute = (args, cb) => {
  child_process.exec(`./alder.js ${args}`, {}, (err, stdout, stderr) => {
    if (err) {
      throw err
    }
    expect(stdout).toMatchSnapshot()
    cb()
  })
}

describe('alder', () => {
  [
    '',
    '-a',
    '-d',
    '-i',
    '-f',
    '-s',
    '-e bar',
    '-p bar',
    '-d',
    '--prune',
    '--filelimit=3',
    '--jsx'
  ].map(flag => {
    it(`works with the ${flag} flag`, (done) => {
      execute(`fixtures ${flag}`, done)
    })
  })
})
