import express from 'express'
import bodyParser from 'body-parser'
import { dirname, join, isAbsolute, basename, sep } from 'path'
import { pathToFileURL } from 'url'

export default (options = {}) => {
  let {
    apis = 'apis',
    url = '/apis',
    jsonLimit = '50M'
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
      let m = await import(pathToFileURL(dirname(mPath) + '.mjs'))
      // console.log(m)
      return res.json({ data: await m[basename(path)](...body) })
    } catch (error) {
      console.log(error)
      res.json({ error })
    }
  })
  return app
}
