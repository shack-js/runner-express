import express, { Express } from 'express'
import bodyParser from 'body-parser'
import { join, isAbsolute, } from 'path'
import getMethodMjs, { getModule, getModuleMethod } from './get-method'

const INIT_FILE = '_init'

type FullOptions = {
  apis: string
  url: string
  jsonLimit: string
  extension: string
  static: string
  dev: boolean,
  commonjs: boolean,
  beforeParser: HookCallBack,
  beforeApi: HookCallBack,
  beforeStatic: HookCallBack,
  afterInit: HookCallBack,
}

type Options = Partial<FullOptions>

interface HookOptions extends FullOptions {
  apiFolder: string,
  assetsFolder: string,
}

type HookCallBack = (app?: Express, options?: Options) => void | any
type HookMethod = 'beforeParser' | 'beforeApi' | 'beforeStatic' | 'afterInit' | 'default'

export async function getApp(options: Options = {}, app1?: Express) {
  let {
    apis = 'apis',
    url = '/apis',
    jsonLimit = '50mb',
    extension = '.mjs',
    dev = false,
    commonjs = false,
    beforeParser = () => { },
    beforeApi = () => { },
    beforeStatic = () => { },
    afterInit = () => { }
  } = options
  let staticPath = options.static || 'dist'
  let rootFolder = process.cwd()
  let apiFolder = isAbsolute(apis) ? apis : join(rootFolder, apis)
  let assetsFolder = isAbsolute(staticPath) ? staticPath : join(rootFolder, staticPath)
  let opts: HookOptions = {
    apis,
    url,
    jsonLimit,
    extension,
    dev,
    commonjs,
    beforeApi,
    beforeParser,
    beforeStatic,
    afterInit,
    apiFolder,
    assetsFolder,
    static: options.static
  }

  let initModule = await getModule(join(apiFolder, INIT_FILE) + extension)

  let app = app1 || express()
  await beforeParser(app, opts)
  await tryInit('beforeParser')
  app.use(bodyParser.json({ limit: jsonLimit }))
  await beforeApi(app, opts)
  await tryInit('beforeApi')
  app.use(url, async (req, res) => {
    let { path, body } = req
    try {
      let httpMethod = getMethod(path)
      if (httpMethod != req.method) throw `${path} shall go ${httpMethod}`
      if (httpMethod == 'GET') {
        const { q } = req.query
        body = q == undefined
          ? []
          : Array.isArray(q)
            ? q
            : [q]
      }
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
      // console.log(body)
      return res.json({ data: await method.apply(ctx, body) })
    } catch (error) {
      console.log(error)
      res.json({ error })
    }
  })
  await beforeStatic(app, opts)
  await tryInit('beforeStatic')
  app.use('/', express.static(assetsFolder))
  await afterInit(app, opts)
  await tryInit('afterInit')
  await tryInit('default')
  return app

  async function tryInit(method: HookMethod) {
    if (!initModule) return
    let fn = getModuleMethod(initModule, method)
    fn && await fn(app, opts)
  }

  function getMethod(url: string) {
    let basename = url.substring(url.lastIndexOf('/') + 1).toUpperCase()
    for (let method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
      if (basename.startsWith(method)) return method
    }
    return 'POST'
  }

}

export default getApp