#!/usr/bin/env node
import commander from 'commander'
import getApp from './index.cjs'

let { program } = commander

program
  .name('runner-express')
  .option('-a, --apis', 'expose scripts in folder', 'api')
  .option('-u, --url', 'as apis under', '/api')
  .option('-p, --port', 'on port', parseInt, 3000)
  .option('-s, --static', 'assets folder to serve static', 'dist')
  .action(async (options = {}) => {
    let app = getApp(options)
    let { port = 3000 } = options
    app.listen(port, () => console.log(`express runner started on port ${port}`))
  })
  .parse()
