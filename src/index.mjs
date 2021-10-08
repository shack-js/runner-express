import express from 'express'
import bodyParser from 'body-parser'
import { join, isAbsolute, } from 'path'
import getMethodMjs, { getModule } from './get-method.mjs'

const INIT_FILE = '_init'

export default async (options = {}, beforeInit = async () => { }) => {
  let {
    apis = 'apis',
    url = '/apis',
    jsonLimit = '50mb',
    extension = '.mjs',
    dev = false
  } = options
  let staticPath = options.static || 'dist'
  let rootFolder = process.cwd()
  let apiFolder = isAbsolute(apis) ? apis : join(rootFolder, apis)
  let assetsFolder = isAbsolute(staticPath) ? staticPath : join(rootFolder, staticPath)
  let app = express()
  app.use(bodyParser.json({ limit: jsonLimit }))
  app.use(url, async (req, res) => {
    let { path, body } = req
    try {
      let [method, auths] = await getMethodMjs(apiFolder, path, extension, dev)
      // auth from 'apis/_auth.mjs' to 'apis/a/b/c/.../_auth.mjs'
      // console.log(auths)
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
  let config = {
    apiFolder, assetsFolder, url, jsonLimit, extension, dev
  }
  await beforeInit(app, config)
  app.use('/', express.static(assetsFolder))
  let initModule = await getModule(join(apiFolder, INIT_FILE) + extension)
  if (initModule) {
    await ((initModule.default.default || initModule.default)(app, config))
  }
  return app
}
