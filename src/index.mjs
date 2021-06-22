import express from 'express'
import bodyParser from 'body-parser'
import { join, isAbsolute, } from 'path'
import getMethodMjs from './get-method.mjs'

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
    try {
      let [method, auths] = await getMethodMjs(apiFolder, path, extension)
      // auth from 'apis/_auth.mjs' to 'apis/a/b/c/.../_auth.mjs'
      let ctx = {}
      for (let auth of auths) {
        let t = await auth(req, ctx, body)
        ctx = (t === undefined) ? ctx : t
      }
      // call apis/.../file/method
      // console.log(ctx, method.toString())
      return res.json({ data: await method.apply(ctx, body) })
    } catch (error) {
      console.log(error)
      res.json({ error })
    }
  })
  return app
}
