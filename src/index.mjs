import express from 'express'
import bodyParser from 'body-parser'
import { dirname, join, isAbsolute, basename, sep } from 'path'
import { pathToFileURL } from 'url'

export default (options = {}) => {
  let {
    apis = 'apis',
    url = '/apis',
    jsonLimit = '50M',
    extension = '.mjs'
  } = options
  let staticPath = options.static || 'dist'
  let rootFolder = process.cwd()
  let apiFolder = isAbsolute(apis) ? apis : join(rootFolder, apis)
  let assetsFolder = isAbsolute(staticPath) ? staticPath : join(rootFolder, staticPath)
  let app = express()
  app.use('/', express.static(assetsFolder))
  app.use(bodyParser.json({ limit: jsonLimit }))
  app.use(url, async (req, res) => {
    let { path, body } = req
    let mPath = join(apiFolder, path.replace(/\//g, sep))
    // console.log({ mPath, apiFolder, path })
    try {
      let m = await import(pathToFileURL(dirname(mPath) + extension))
      // console.log(m)
      let method = basename(path)
      return res.json({ data: await (m[method] || m.default[method])(...body) })
    } catch (error) {
      console.log(error)
      res.json({ error })
    }
  })
  return app
}
