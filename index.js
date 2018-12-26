const fs = require("fs");
const path = require("path");
function search(filePath, func, complete){
  let filelists = fs.readdirSync(filePath) || [];
  let count = filelists.length;
  filelists.forEach(function (filename) {
    machining(filePath, filename, func, function(type){
      count--;
      count === 0 && complete && complete();
    });
  });
  // 一般没有需要处理的文件的话才会到这里
  count === 0 && complete && complete();
}
/**
 * 对文件和文件夹进行处理
 * @param {string} filePath 目录
 * @param {string} filename 文件名
 * @param {function} func 处理函数
 * @param {function} done 处理完毕回调
 */
function machining(filePath, filename, func, done){
  let isCallback = false;
  if (!/^(\/|\\)$/.test(filename)) {
    let current = path.join(filePath, filename)
    try {
      let stats = fs.fstatSync(fs.openSync(current, 'r'))
      if (stats.isFile()) {
        isCallback = true;
        // 文件需要等处理完的回调
        func({
          isDir: false,
          path: current,
          name: filename
        }, function(){
          done('file');
        });
      } else if (stats.isDirectory()) {
        isCallback = true;
        func({
          isDir: true,
          path: current,
          name: filename
        }, function(verifyed){
          if(verifyed){
            // 文件夹的话, 需要等search的complete回调 冒泡
            search(current, func, function(){
              done('dir');
            });
          } else {
            done('dir');
          }
        })
      }
    } catch (e) {
      console.log(e);
    }
  } else {
  }
  if(!isCallback){
    done('exclude');
  }
}
/**
 * 读取文件内容并调用loader
 * @param {object} stats 文件信息
 * @param {function} loader 加载器
 * @param {function} done 处理完毕回调
 */
function loaderHandler(stats, loader, done){
  fs.readFile(stats.path, 'utf8', function (err, data) {
    if (data && loader instanceof Function) {
      loader(stats, data);
    }
    done();
  });
}
/**
 * 对文件夹进行验证
 * @param {string|RegExp} include 包含的字符
 * @param {string|RegExp} loader 排除的字符
 * @param {string} name 文件夹名
 */
function verifyDir(include, exclude, name){
  // 如果没有设置包含, 则直接通过
  let isInclude = include ? include.test(name) : true;
  // 如果没有设置排除, 则不排除
  let isExclude = exclude ? exclude.test(name) : false;
  let isBig = /^(node_modules)$/.test(name);

  // 如果是比较大的文件夹, 必须在 include 的正则表达式里指定, 否则忽略
  if(isBig && include && !isInclude){
    return false;
  }
  // 包含或没有被排除
  return isInclude && !isExclude;
}
/**
 * 对文件进行验证
 * @param {string} filepath 文件路径
 * @param {string|RegExp} ext 扩展名
 */
function verifyExt(filepath, ext){
  let isInclude = false;
  let info = path.parse(filepath);
  let iext = info.ext ? info.ext.slice(1) : '';
  if (ext && iext){
    if(typeof ext ==='string' && ext === iext){
      isInclude = true;
    } else if(ext instanceof RegExp && ext.test(iext)){
      isInclude = true;
    }
  }
  return isInclude;
}

module.exports = function exec(option){
  option = option || {};
  if(!option.path){
    option.done && option.done();
  }
  let startPath = option.path;
  search(startPath, function(stats, done){
    if (stats.isDir) {
      done(verifyDir(option.include, option.exclude, stats.name));
    } else {
      if(verifyExt(stats.path, option.ext)){
        loaderHandler(stats, option.loader, function(){
          done(true);
        });
      } else {
        done(false);
      }
    }
  }, function(){
    option.done && option.done();
  })
  return startPath
}
