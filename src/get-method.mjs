import { dirname, join, basename, sep } from 'path'

const cache = {}

export default async (apiFolder, urlPath, extension) => {
  const methodPath = join(apiFolder, urlPath.replace(/\//g, sep))
  const tmpModule = await getModule(dirname(methodPath), extension)
  const methodName = basename(path)
  return tmpModule[methodName] || tmpModule.default[methodName]
}

async function getModule(filePath, extension) {
  if (!cache[filePath]) cache[filePath] = await import(pathToFileURL(filePath + extension))
  return cache[filePath]
}
