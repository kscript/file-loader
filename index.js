const fs = require("fs")
const path = require("path")

function search(filePath, func, complete, option) {
  fs.readdir(filePath, function (err, filelists) {
    if (err) {
      throw err
    }
    if (filelists && filelists.length) {
      let count = filelists.length
      filelists.forEach(function (filename) {
        machining(filePath, filename, func, function (type) {
          count--
          count === 0 && complete && complete()
        }, option)
      })
    } else {
      complete && complete()
    }
  })
}

function Async(func){
  return new Promise(function (resolve, reject) {
    func(function(err, data){
      if(err){
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * 对文件和文件夹进行处理
 * @param {string} filePath 目录
 * @param {string} filename 文件名
 * @param {function} func 处理函数
 * @param {function} done 处理完毕回调
 */
function machining(filePath, filename, func, done, option) {
  if (!/^(\/|\\)$/.test(filename)) {
    let current = path.join(filePath, filename)
    Async(function(cb){
      fs.open(current, 'r', cb)
    }).then(function(file) {
      return Async(function(cb){
        fs.fstat(file, cb)
      })
    }).then(function(stats){
      if (stats.isFile()) {
        // 文件需要等处理完的回调
        func({
          isDir: false,
          path: current,
          name: filename
        }, function () {
          done('file')
        })
      } else if (stats.isDirectory()) {
        func({
          isDir: true,
          path: current,
          name: filename
        }, function (verifyed) {
          if (verifyed || !option.deep) {
            // 文件夹的话, 需要等search的complete回调 冒泡
            search(current, func, function () {
              done('dir')
            }, option)
          } else {
            done('dir')
          }
        })
      } else {
        done('exclude')
      }
    })
  } else {
    done('exclude')
  }
}

/**
 * 读取文件内容并调用loader
 * @param {object} stats 文件信息
 * @param {function} loader 加载器
 * @param {function} done 处理完毕回调
 */
function loaderHandler(stats, loader, done) {
  fs.readFile(stats.path, 'utf8', function (err, data) {
    if (data && loader instanceof Function) {
      loader(stats, data, done)
    } else {
      done()
    }
  })
}

/**
 * 对文件夹进行验证
 * @param {string|RegExp} include 包含的字符
 * @param {string|RegExp} loader 排除的字符
 * @param {string} name 文件夹名
 */
function verifyDir(include, exclude, name) {
  let isBig = /^(node_modules)$/.test(name)
  let isInclude = include ? include.test(name) : true
  let isExclude = exclude ? exclude.test(name) : false

  // 如果是比较大的文件夹, 必须在 include 的正则表达式里指定, 否则忽略
  return isBig ? include && isInclude : isExclude
}

/**
 * 对文件进行验证
 * @param {string} filepath 文件路径
 * @param {string|RegExp} ext 扩展名
 */
function verifyExt(filepath, ext) {
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

module.exports = function exec(option) {
  option = option || {}
  if (!option.path) {
    option.done && option.done()
    return 
  }
  search(option.path, function (stats, done) {
    if (stats.isDir) {
      done(verifyDir(option.include, option.exclude, stats.name))
    } else {
      if (verifyExt(stats.path, option.ext)) {
        if (!option.loader) {
          done(true)
        } else if (option.readFile) {
          loaderHandler(stats, option.loader, function () {
            done(true)
          })
        } else {
          option.loader(stats, '', function () {
            done(true)
          })
        }
      } else {
        done(false)
      }
    }
  }, function () {
    option.done && option.done()
  },
  option)
}
