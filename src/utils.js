const fs = require('fs')

const verbose = false
exports.writeLog = (...args) => {
  if (verbose) {
    let msg = ''
    for (let i=0; i<args.length; i++) {
      if (typeof args[i] == 'object') { 
        msg += JSON.stringify(args[i]) + ' '
      } else {
        msg += args[i] + ' '
      }
    }
    fs.appendFile('log.txt', `\n\n || ${msg}||`, (err) => {
      if (err) {
        console.log('Did not write log => ', err)
      } else {
        console.log('Log.txt has been updated')
      }
    })
  }
}