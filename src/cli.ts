#!/usr/bin/env node
import commander from 'commander'
import getApp from './index'

let { program } = commander

program
  .name('runner-express')
  .option('-a, --apis <folder>', 'expose scripts in folder', 'apis')
  .option('-u, --url <base>', 'as apis under', '/apis')
  .option('-p, --port <port>', 'on port', parseInt, 3000)
  .option('-s, --static <folder>', 'assets folder to serve static', 'dist')
  .option('-e, --extension <extension>', 'api file extension', '.mjs')
  .action(async (options = {}) => {
    let app = await getApp(options)
    let { port = 3000 } = options
    app.listen(port, () => console.log(`express runner started on port ${port}`))
  })
  .parse()
