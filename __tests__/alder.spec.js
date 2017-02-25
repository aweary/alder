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
    '-d 1',
    '-D',
    '-e bar',
    '-f',
    '-i',
    '-I',
    '-p bar',
    '-s',
    '-t',
    '--prune',
    '--filelimit=3',
    '--jsx'
  ].map(flag => {
    it(`works with the '${flag}' flag`, (done) => {
      execute(`fixtures ${flag}`, done)
    })
  })
})
