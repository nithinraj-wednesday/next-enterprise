#!/usr/bin/env node
/* oxlint-disable no-console */
/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

// edited to work with the appdir by @raphaelbadia

void main()

async function main() {
  const [{ sync: gzipSizeSync }, mkdirpModule, fs, path] = await Promise.all([
    import("gzip-size"),
    import("mkdirp"),
    import("node:fs"),
    import("node:path"),
  ])

  const mkdirpSync =
    mkdirpModule.mkdirpSync ?? mkdirpModule.sync ?? mkdirpModule.default?.mkdirpSync ?? mkdirpModule.default?.sync

  if (!gzipSizeSync || !mkdirpSync) {
    throw new Error("Unable to load bundle analysis dependencies")
  }

  // Pull options from `package.json`
  const options = getOptions(fs, path)
  const BUILD_OUTPUT_DIRECTORY = getBuildOutputDirectory(options)

  // first we check to make sure that the build output directory exists
  const nextMetaRoot = path.join(process.cwd(), BUILD_OUTPUT_DIRECTORY)
  try {
    fs.accessSync(nextMetaRoot, fs.constants.R_OK)
  } catch {
    console.error(
      `No build output found at "${nextMetaRoot}" - you may not have your working directory set correctly, or not have run "next build".`
    )
    process.exit(1)
  }

  // if so, we can import the build manifest
  const buildMeta = readJson(fs, path.join(nextMetaRoot, "build-manifest.json"))
  const appDirMeta = readJson(fs, path.join(nextMetaRoot, "app-build-manifest.json"))

  // this memory cache ensures we dont read any script file more than once
  // bundles are often shared between pages
  const memoryCache = {}

  const globalAppDirBundle = buildMeta.rootMainFiles
  const globalAppDirBundleSizes = getScriptSizes({
    fs,
    gzipSizeSync,
    memoryCache,
    nextMetaRoot,
    path,
    scriptPaths: globalAppDirBundle,
  })

  const allAppDirSizes = Object.entries(appDirMeta.pages).reduce((acc, [pagePath, scriptPaths]) => {
    acc[pagePath] = getScriptSizes({
      fs,
      gzipSizeSync,
      memoryCache,
      nextMetaRoot,
      path,
      scriptPaths: scriptPaths.filter((scriptPath) => !globalAppDirBundle.includes(scriptPath)),
    })

    return acc
  }, {})

  // format and write the output
  const rawData = JSON.stringify({
    ...allAppDirSizes,
    __global: globalAppDirBundleSizes,
  })

  // log ouputs to the gh actions panel
  console.log(rawData)

  mkdirpSync(path.join(nextMetaRoot, "analyze/"))
  fs.writeFileSync(path.join(nextMetaRoot, "analyze/__bundle_analysis.json"), rawData)
}

// --------------
// Util Functions
// --------------

// given an array of scripts, return the total of their combined file sizes
function getScriptSizes({ fs, gzipSizeSync, memoryCache, nextMetaRoot, path, scriptPaths }) {
  return scriptPaths.reduce(
    (acc, scriptPath) => {
      const [rawSize, gzipSize] = getScriptSize({ fs, gzipSizeSync, memoryCache, nextMetaRoot, path, scriptPath })
      acc.raw += rawSize
      acc.gzip += gzipSize

      return acc
    },
    { raw: 0, gzip: 0 }
  )
}

// given an individual path to a script, return its file size
function getScriptSize({ fs, gzipSizeSync, memoryCache, nextMetaRoot, path, scriptPath }) {
  const encoding = "utf8"
  const p = path.join(nextMetaRoot, scriptPath)

  let rawSize, gzipSize
  if (Object.keys(memoryCache).includes(p)) {
    rawSize = memoryCache[p][0]
    gzipSize = memoryCache[p][1]
  } else {
    const textContent = fs.readFileSync(p, encoding)
    rawSize = Buffer.byteLength(textContent, encoding)
    gzipSize = gzipSizeSync(textContent)
    memoryCache[p] = [rawSize, gzipSize]
  }

  return [rawSize, gzipSize]
}

/**
 * Reads options from `package.json`
 */
function getOptions(fs, path, pathPrefix = process.cwd()) {
  const pkg = readJson(fs, path.join(pathPrefix, "package.json"))

  return { ...pkg.nextBundleAnalysis, name: pkg.name }
}

function readJson(fs, filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

/**
 * Gets the output build directory, defaults to `.next`
 *
 * @param {object} options the options parsed from package.json.nextBundleAnalysis using `getOptions`
 * @returns {string}
 */
function getBuildOutputDirectory(options) {
  return options.buildOutputDirectory || ".next"
}
