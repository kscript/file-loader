import { Option } from '../'
import * as fs from 'fs';
import * as path from 'path';

const cb2promise = (callback: Function): Promise<any> => {
  return new Promise((resolve, reject) => {
    callback((err: Error, data: any) => {
      err ? reject(err) : resolve(data)
    })
  })
}

export class Loader {
  public option: Option = {};
  constructor(option: Option) {
    this.option = option
  }
  search(filePath: string): Promise<any> {
    return cb2promise((cb) => {
      fs.readdir(filePath, cb)
    }).then((filelists: any[]) => {
      return Promise.all(
        filelists.map(filename => {
          return this.machining(filePath, filename)
        })
      )
    })
  }
  getStats(filePath: string) {
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
   */
  machining(filePath: string, filename: string) {
    const option: Option = this.option
    return new Promise((resolve, reject) => {
      if (!/^(\/|\\)$/.test(filename)) {
        let current = path.join(filePath, filename)
        this.getStats(current)
          .then((stats: fs.Stats) => {
            if (stats.isFile()) {
              if (this.verifyFile(current, option.ext, option.name)) {
                // 文件需要等处理完的回调
                return this.loaderHandler(Object.assign({}, stats, {
                  type: 'file',
                  path: current,
                  name: filename
                }), () => {
                  resolve('file')
                })
              }
            } else if (stats.isDirectory()) {
              if (this.verifyDir(option.include, option.exclude, current)) {
                return this.loaderHandler(Object.assign({}, stats, {
                  type: 'dir',
                  path: current,
                  name: filename
                }), () => {
                  if (option.deep) {
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
  loaderHandler(stats: any, done: Function, error?: (error: Error, stats: Object) => void) {
    const option: Option = this.option
    const loader = option.loader
    error = error || option.error;
    if (typeof loader === 'function') {
      if (stats.isDir || stats.type === 'dir') {
        !option.ext || option.showDir ? loader(stats, '', done) : done()
      } else if (option.readFile) {
        fs.readFile(stats.path, 'utf8', (err, data) => {
          err ? error && done(error(err, stats)) : loader(stats, data, done)
        })
      } else {
        loader(stats, '', done)
      }
    } else {
      done()
    }
  }
  /**
   * 对文件夹进行验证
   * @param {string|RegExp} include 包含的字符
   * @param {string|RegExp} loader 排除的字符
   * @param {string} name 文件夹名
   */
  verifyDir(include: string | RegExp, exclude: string | RegExp, name) {
    let isBig = /^(node_modules)$/.test(name)
    let isInclude = include instanceof RegExp ? include.test(name) : true
    let isExclude = exclude instanceof RegExp ? exclude.test(name) : false
    // 如果是 比较大的文件夹, 必须在 include 的正则表达式里指定, 否则忽略
    // 如果不是, 那么判断是否符合 包含且不排除
    return isBig ? include && isInclude : isInclude && !isExclude
  }
  /**
   * 对文件进行验证
   * @param {string} filepath 文件路径
   * @param {string|RegExp} ext 扩展名
   */
  verifyFile(filepath: string, ext: Option['ext'], name: Option['name']) {
    let info = path.parse(filepath)
    let iext = info.ext ? info.ext.slice(1) : ''
    if (name === void 0 || typeof name === 'string' && ~info.name.indexOf(name) || name instanceof RegExp && name.test(info.name)) {
      return ext === void 0 || typeof ext === 'string' && ext === iext || ext instanceof RegExp && ext.test(iext);
    }
    return false;
  }
}
export default Loader
