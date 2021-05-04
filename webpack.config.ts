import { Chunk, Compiler, Configuration } from 'webpack'
import path from 'path'
import fs from 'fs'
import http, { ClientRequest } from 'http'
import querystring from 'querystring'
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin'

const authTokenFile = './.auth_token'

interface APIResponse {
  message: string
}

interface SaveSlot {
  name: string
  slot: number
}

function getAuthCookie(): string {
  if (!fs.existsSync(authTokenFile)) {
    throw new Error(`${authTokenFile} not found`) // You create this file, with your "auth" cookie value in it.
  }
  const token = fs.readFileSync(authTokenFile).toString()
  return `auth=${token}`
}

const saveMap: { [filename: string]: SaveSlot } = {
  './src/saves/attacker.ts': { name: 'attacker', slot: 101 },
  './src/saves/courier.ts': { name: 'courier', slot: 102 },
  './src/saves/follower.ts': { name: 'follower', slot: 103 },
  './src/saves/leader.ts': { name: 'leader', slot: 104 },
  './src/saves/snippets.ts': { name: 'snippets', slot: 105 },
  './src/saves/upgrader.ts': { name: 'upgrader', slot: 106 },
}

const authCookie: string = getAuthCookie()

class AdventurelandUploader {
  private chunkHashes: Map<string, string> = new Map() // to detect changes

  // A map from the output JS file names to the request that is handling them,
  // so that we can abort ongoing requests if a rebuild is triggered before a request
  // from a previous rebuild is finished
  private requestMap: Map<string, ClientRequest> = new Map()

  private uploadFile = (jsFile: string, saveName: string, slot: number) => {
    const code = fs.readFileSync(jsFile)
    const req = http.request(
      {
        hostname: 'adventure.land',
        path: '/api/save_code',
        method: 'POST',
        headers: {
          'Cookie': authCookie,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
      res => {
        res.on('data', o => {
          const response = o as APIResponse[]
          console.log(`${jsFile}: ${response[0].message}`)
        })
      }
    )
    req.on('error', e => console.error('Adventureland API connection error', e))

    const previousRequest = this.requestMap.get(jsFile)
    if (previousRequest) {
      console.log('Aborting previous request...')
      previousRequest.destroy()
    }
    this.requestMap.set(jsFile, req)

    // convolutedly: /save_code?method=save_code?arguments={"code":"",...}
    const obj = {
      method: 'save_code',
      arguments: JSON.stringify({
        slot: slot.toString(),
        code: code.toString(),
        name: saveName,
        log: '0',
      }),
    }

    req.write(querystring.stringify(obj))
    req.end()
  }

  private processFile = (tsFile: string, jsFile: string) => {
    console.log('processFile', { tsFile, jsFile })
    const save = saveMap[tsFile]
    if (save) this.uploadFile(jsFile, save.name, save.slot)
  }

  private processChunk = (chunk: Chunk) => {
    chunk.files.forEach(f => this.processFile(chunk.entryModule?., f))
    // chunk.files.forEach(f => this.processFile(chunk.entryModule.rawRequest, f))
  }

  public apply(compiler: Compiler) {
    compiler.hooks.afterEmit.tap('AdventurelandUploader', compilation => {
      Array.from(compilation.chunks)
        .filter((chunk: Chunk) => {
          const oldHash = this.chunkHashes.get(chunk.name)
          this.chunkHashes.set(chunk.name, chunk.hash)
          return !oldHash || oldHash !== chunk.hash
        })
        .forEach(this.processChunk)
    })
  }
}

const config: Configuration = {
  mode: 'development',
  // list all the files here that you would like to build individually.
  devtool: 'eval-source-map',
  entry: Object.entries(saveMap).reduce(
    (prev, [filename, save]) => ({ ...prev, [save.name]: filename }),
    {}
  ),
  output: {
    filename: 'dist/[name].js',
    path: __dirname,
  },
  resolve: {
    extensions: ['.ts'],
    modules: [path.resolve(__dirname, 'src')],
  },
  plugins: [new FriendlyErrorsWebpackPlugin(), new AdventurelandUploader()],
  module: {
    rules: [
      {
        include: [path.resolve(__dirname, 'src')],
        test: /\.ts$/,
        use: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
}

export default config
