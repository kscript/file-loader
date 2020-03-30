import { Option } from '..'
import * as fs from 'fs'
import * as path from 'path'
const hashFile = require('hash-file')

const cb2promise = (callback: Function): Promise<any> => {
  return new Promise((resolve, reject) => {
    callback((err: Error, data: any) => {
      err ? reject(err) : resolve(data)
    })
  })
}

export class Loader {
  public option: Option = {}
  constructor(option: Option) {
    this.option = option
  }
  search(filePath: string): Promise<any> {
    return cb2promise((cb) => {
      fs.readdir(filePath, cb)
    }).then((filelists: any[]) => {
      if (this.option.mode === 'BFS' || this.option.deep === false) {
        let queue
        if (this.option.async) {
          queue = Promise.all(
            filelists.map(filename => {
              return this.machining(filePath, filename, false).then((type: string) => {
                return type === 'dir' ? path.join(filePath, filename) : ''
              })
            })
          )
        } else {
          queue = new Promise((resolve) => {
            let rest: string[] = []
            let current = Promise.resolve()
            filelists.forEach(filename => {
              current = current.then(() => {
                return this.machining(filePath, filename, false).then((type: string) => {
                  rest.push(type === 'dir' ? path.join(filePath, filename) : '')
                  return type === 'dir' ? path.join(filePath, filename) : ''
                })
              })
            })
            current.then(() => {
              resolve(rest)
            })
          })
        }
        return this.option.deep ? queue.then((rest: string[]) => {
          let dirs = rest.filter(filePath => !!filePath)
          return Promise.all(dirs.map((item: string) => {
            return this.search(item)
          })
          )
        }) : queue
      } else {
        let queue: Promise<any> = Promise.resolve()
        filelists.forEach(filename => {
          queue = queue.then(() => {
            return this.machining(filePath, filename)
          })
        })
        return queue
      }
    })
  }
  getStats(filePath: string): Promise<fs.Stats> {
    return cb2promise(cb => {
      // 打开文件/文件夹
      fs.open(filePath, 'r', cb)
    })
      .then((file: number) => {
        // 读取文件/文件夹信息
        return cb2promise(cb => {
          fs.fstat(file, cb)
        })
      })
  }
  /**
   * 对文件和文件夹进行处理
   * @param {string} filePath 目录
   * @param {string} filename 文件名
   * @param {boolean} deep 是否深度遍历
   */
  machining(filePath: string, filename: string, deep: boolean = this.option.deep): Promise<string> {
    const option: Option = this.option
    return new Promise((resolve, reject) => {
      if (!/^(\/|\\)$/.test(filename)) {
        let current = path.join(filePath, filename)
        this.getStats(current)
          .then((stats: fs.Stats) => {
            if (stats.isFile()) {
              if (this.verifyFile(current, option.ext, option.name)) {
                let names = filename.split('.')
                // 文件需要等处理完的回调
                return this.loaderHandler(Object.assign({}, stats, {
                  type: 'file',
                  ext: names.slice(-1)[0] || '',
                  dir: filePath,
                  path: current,
                  name: names.slice(0, -1).join('.') || ''
                }), () => {
                  resolve('file')
                })
              }
            } else if (stats.isDirectory()) {
              if (this.verifyDir(option.include, option.exclude, current)) {
                return this.loaderHandler(Object.assign({}, stats, {
                  type: 'dir',
                  ext: '',
                  dir: filePath,
                  path: current,
                  name: filename
                }), () => {
                  if (deep) {
                    // 遍历子文件夹
                    this.search(current).then(() => {
                      resolve('dir')
                    }).catch(err => {
                      reject(err)
                    })
                  } else {
                    resolve('dir')
                  }
                })
              }
            }
            resolve('exclude')
          })
          .catch(err => {
            reject(err)
          })
      } else {
        resolve('exclude')
      }
    })
  }
  /**
   * 读取文件内容并调用loader
   * @param {object} stats 文件信息
   * @param {function} loader 加载器
   * @param {function} done 处理完毕回调
   * @param {function} error 出错时回调
   */
  loaderHandler(stats: any, done: Function, error?: (error: Error, stats: Object) => void): void {
    const option: Option = this.option
    const loader = option.loader
    error = error || option.error
    if (typeof loader === 'function' || option.output) {
      if (stats.isDir || stats.type === 'dir') {
        if (!option.ext || option.showDir) {
          this.execLoader(loader, done, stats, '')
        } else {
          done()
        }
      } else if (option.readFile) {
        fs.readFile(stats.path, 'utf8', (err, data) => {
          if (err) {
            error && done(error(err, stats))
          } else {
            this.execLoader(loader, done, stats, data)
          }
        })
      } else {
        this.execLoader(loader, done, stats, '')
      }
    } else {
      done()
    }
  }
  async execLoader(loader, done, stats, data): Promise<void> {
    let outputRes: void | string
    const option: Option = this.option
    const dir = option.outputDir
    let output = option.output
    if (!output || typeof output === 'function') {
      const func = output || loader
      // output 为函数时, 功能等同于loader
      const result: Promise<any> | false | any = func(stats, data, done)
      if (output && typeof result === 'string') {
        // 返回值为string时, 可以视为 string 类型的 output
        outputRes = result
      } else {
        if (result instanceof Promise) {
          result.then(() => {
            done()
          }).catch(() => {
            done()
          })
        } else {
          if (result !== false) {
            done()
          }
          // 为false时, 需要用户自行调用done
        }
        return
      }
    }

    output = outputRes || output
    if (typeof output === 'string' && stats.type === 'file') {
      const hash = (/\[hash\]/.test(output) ? await hashFile(stats.path) : '').slice(0, 8)
      const maps = {
        hash,
        name: stats.name,
        path: stats.path,
        dir: dir || stats.dir,
        ext: stats.ext
      }
      fs.writeFile(
        output.replace(
          /\[(.*?)(path|dir|name|hash|ext)(.*?)\](\?|)/g, 
          (s, $1, $2, $3, $4) => $4 && !maps[$2] ? '' : `${$1}${maps[$2]}${$3}`
        ),
        data,
        (err) => void done()
      )
    }
    done()
  }
  /**
   * 对文件夹进行验证
   * @param {string|RegExp} include 包含的字符
   * @param {string|RegExp} loader 排除的字符
   * @param {string} name 文件夹名
   */
  verifyDir(include: string | RegExp, exclude: string | RegExp, name): boolean {
    let isIgnore = /^(node_modules|.git|.log|.temp)$/.test(name)
    let isInclude = include instanceof RegExp ? include.test(name) : true
    let isExclude = exclude instanceof RegExp ? exclude.test(name) : false
    // 如果是 默认忽略的文件夹, 必须在 include 的正则表达式里指定, 否则忽略
    // 如果不是, 那么判断是否符合 包含且不排除
    return isIgnore ? include && isInclude : isInclude && !isExclude
  }
  /**
   * 对文件进行验证
   * @param {string} filepath 文件路径
   * @param {string|RegExp} ext 扩展名
   */
  verifyFile(filepath: string, ext: Option['ext'], name: Option['name']): boolean {
    let info = path.parse(filepath)
    let iext = info.ext ? info.ext.slice(1) : ''
    let fullName = this.option.fullName
    // 解决.d.ts
    if (typeof fullName === 'string') {
      return fullName ? (info.name + info.ext).indexOf(fullName) > 0 : !!1
    } else if (fullName instanceof RegExp) {
      return fullName.test(info.name + info.ext)
    }
    if (name && typeof name === 'string' ? ~info.name.indexOf(name) : name instanceof RegExp ? name.test(info.name) : !!1) {
      return ext && typeof ext === 'string' ? ext === iext : ext instanceof RegExp ? ext.test(iext) : !!1
    }
  }
}
export default Loader
