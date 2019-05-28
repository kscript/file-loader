const fs = require("fs")
const path = require("path")
let option = null
const cb2promise = (callback) => {
  return new Promise((resolve, reject) => {
    callback((err, data) => {
      err ? reject(err) : resolve(data)
    })
  })
}
class Loader {
  constructor(option) {
    this.option = option
  }
  search(filePath) {
    return cb2promise((cb) => {
      fs.readdir(filePath, cb)
    }).then(filelists => {
      return Promise.all(
        filelists.map(filename => {
          return this.machining(filePath, filename)
        })
      )
    })
  }
  getStats(filePath) {
    return cb2promise(cb => {
      // 打开文件/文件夹
      fs.open(filePath, 'r', cb)
    })
      .then(file => {
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
  machining(filePath, filename) {
    const option = this.option
    return new Promise((resolve, reject) => {
      if (!/^(\/|\\)$/.test(filename)) {
        let current = path.join(filePath, filename)
        this.getStats(current)
          .then(stats => {
            if (stats.isFile()) {
              if (this.verifyExt(current, option.ext)) {
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
   */
  loaderHandler(stats, done) {
    const option = this.option
    const loader = option.loader
    if (typeof loader === 'function') {
      if (stats.isDir || !option.readFile) {
        loader(stats, '', done)
      } else {
        fs.readFile(stats.path, 'utf8', (err, data) => {
          if (err) {
            done()
          } else {
            loader(stats, data, done)
          }
        })
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
  verifyDir(include, exclude, name) {
    let isBig = /^(node_modules)$/.test(name)
    let isInclude = include ? include.test(name) : true
    let isExclude = exclude ? exclude.test(name) : false
    // 如果是 比较大的文件夹, 必须在 include 的正则表达式里指定, 否则忽略
    // 如果不是, 那么判断是否符合 包含且不排除
    return isBig ? include && isInclude : isInclude && !isExclude
  }
  /**
   * 对文件进行验证
   * @param {string} filepath 文件路径
   * @param {string|RegExp} ext 扩展名
   */
  verifyExt(filepath, ext) {
    let isInclude = false
    let info = path.parse(filepath)
    let iext = info.ext ? info.ext.slice(1) : ''
    if (ext && iext) {
      if (typeof ext === 'string' && ext === iext) {
        isInclude = true
      } else if (ext instanceof RegExp && ext.test(iext)) {
        isInclude = true
      }
    }
    return isInclude
  }
}

module.exports = (option = {}) => {
  option.path = option.path || './'
  let loader = new Loader(Object.assign({}, option))
  loader.search(loader.option.path).then(() => {
    typeof loader.option.done === 'function' && loader.option.done()
  }).catch(err => {
    typeof loader.option.error === 'function' && loader.option.error(err)
  })
}
