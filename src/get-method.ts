import { dirname, join, basename, sep, relative } from 'path'
import fs from 'fs-extra'
import { pathToFileURL } from 'url'

const cache = {}, AUTH_FILE = '_auth', authCache = {}

export default async (
  apiFolder = '', urlPath = '', extension = '', dev = false
) => {
  const methodPath = join(apiFolder, urlPath.replace(/\//g, sep))
  let tmp = dirname(methodPath), methodName = basename(methodPath)
  // file/method starts wiht '_' are considered private
  if (basename(tmp).startsWith('_')) throw 'illegal urlPath'
  if (methodName.startsWith('_')) throw 'illegal urlPath'
  // console.log({ tmp, methodName, methodPath })

  // auth from 'apis/_auth.mjs' to 'apis/a/b/c/.../_auth.mjs'
  const tmpModule = await getModule(tmp + extension, dev)
  // console.log(tmpModule, { tmp, extension })
  if (!tmpModule) throw 'illegal urlPath'
  let authMethods = await getAuthMethods(tmp, extension, apiFolder, dev)
  // if module exports '_auth' method, auth it
  const authMethod = tmpModule[AUTH_FILE]
    || (tmpModule.default && tmpModule.default[AUTH_FILE])
  if (authMethod) authMethods = authMethods.concat([authMethod])

  // return method
  return [
    tmpModule[methodName] || tmpModule.default[methodName],
    authMethods
  ]
}

export async function getModule(filePath: string, force = false) {
  if (cache[filePath] === undefined || force) {
    cache[filePath] = (await fs.pathExists(filePath))
      //@ts-ignore
      ? cache[filePath] = await import(pathToFileURL(filePath))
      : null
  }
  return cache[filePath]
}

async function getAuthMethods(
  modluePath = '', extension = '', baseFolder: string = '', dev = false
) {
  let folder = dirname(modluePath), tarr = [], t = folder
  while (true) {
    if (authCache[t]) {
      return setCache(authCache[t].concat(tarr))
    }
    let m = await getModule(join(t, AUTH_FILE) + extension, dev)
    if (m) tarr.unshift(m.default.default || m.default)
    if (!relative(baseFolder, t)) return setCache(tarr)
    t = dirname(t)
  }

  function setCache(rtn = []) {
    // console.log({ folder, fns: rtn.join('|') })
    return authCache[folder] = rtn
  }
}
