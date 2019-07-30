'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var path = require('path');

var cb2promise = function (callback) {
    return new Promise(function (resolve, reject) {
        callback(function (err, data) {
            err ? reject(err) : resolve(data);
        });
    });
};
var Loader = /** @class */ (function () {
    function Loader(option) {
        this.option = {};
        this.option = option;
    }
    Loader.prototype.search = function (filePath) {
        var _this = this;
        return cb2promise(function (cb) {
            fs.readdir(filePath, cb);
        }).then(function (filelists) {
            if (_this.option.mode === 'BFS' || _this.option.deep === false) {
                return Promise.all(filelists.map(function (filename) {
                    return _this.machining(filePath, filename);
                }));
            }
            else {
                var queue_1 = Promise.resolve();
                filelists.forEach(function (filename) {
                    queue_1 = queue_1.then(function () {
                        return _this.machining(filePath, filename);
                    });
                });
                return queue_1;
            }
        });
    };
    Loader.prototype.getStats = function (filePath) {
        return cb2promise(function (cb) {
            // 打开文件/文件夹
            fs.open(filePath, 'r', cb);
        })
            .then(function (file) {
            // 读取文件/文件夹信息
            return cb2promise(function (cb) {
                fs.fstat(file, cb);
            });
        });
    };
    /**
     * 对文件和文件夹进行处理
     * @param {string} filePath 目录
     * @param {string} filename 文件名
     */
    Loader.prototype.machining = function (filePath, filename) {
        var _this = this;
        var option = this.option;
        return new Promise(function (resolve, reject) {
            if (!/^(\/|\\)$/.test(filename)) {
                var current_1 = path.join(filePath, filename);
                _this.getStats(current_1)
                    .then(function (stats) {
                    if (stats.isFile()) {
                        if (_this.verifyFile(current_1, option.ext, option.name)) {
                            // 文件需要等处理完的回调
                            return _this.loaderHandler(Object.assign({}, stats, {
                                type: 'file',
                                path: current_1,
                                name: filename
                            }), function () {
                                resolve('file');
                            });
                        }
                    }
                    else if (stats.isDirectory()) {
                        if (_this.verifyDir(option.include, option.exclude, current_1)) {
                            return _this.loaderHandler(Object.assign({}, stats, {
                                type: 'dir',
                                path: current_1,
                                name: filename
                            }), function () {
                                if (option.deep) {
                                    // 遍历子文件夹
                                    _this.search(current_1).then(function () {
                                        resolve('dir');
                                    }).catch(function (err) {
                                        reject(err);
                                    });
                                }
                                else {
                                    resolve('dir');
                                }
                            });
                        }
                    }
                    resolve('exclude');
                })
                    .catch(function (err) {
                    reject(err);
                });
            }
            else {
                resolve('exclude');
            }
        });
    };
    /**
     * 读取文件内容并调用loader
     * @param {object} stats 文件信息
     * @param {function} loader 加载器
     * @param {function} done 处理完毕回调
     * @param {function} error 出错时回调
     */
    Loader.prototype.loaderHandler = function (stats, done, error) {
        var option = this.option;
        var loader = option.loader;
        error = error || option.error;
        if (typeof loader === 'function') {
            if (stats.isDir || stats.type === 'dir') {
                !option.ext || option.showDir ? loader(stats, '', done) : done();
            }
            else if (option.readFile) {
                fs.readFile(stats.path, 'utf8', function (err, data) {
                    err ? error && done(error(err, stats)) : loader(stats, data, done);
                });
            }
            else {
                loader(stats, '', done);
            }
        }
        else {
            done();
        }
    };
    /**
     * 对文件夹进行验证
     * @param {string|RegExp} include 包含的字符
     * @param {string|RegExp} loader 排除的字符
     * @param {string} name 文件夹名
     */
    Loader.prototype.verifyDir = function (include, exclude, name) {
        var isBig = /^(node_modules)$/.test(name);
        var isInclude = include instanceof RegExp ? include.test(name) : true;
        var isExclude = exclude instanceof RegExp ? exclude.test(name) : false;
        // 如果是 比较大的文件夹, 必须在 include 的正则表达式里指定, 否则忽略
        // 如果不是, 那么判断是否符合 包含且不排除
        return isBig ? include && isInclude : isInclude && !isExclude;
    };
    /**
     * 对文件进行验证
     * @param {string} filepath 文件路径
     * @param {string|RegExp} ext 扩展名
     */
    Loader.prototype.verifyFile = function (filepath, ext, name) {
        var info = path.parse(filepath);
        var iext = info.ext ? info.ext.slice(1) : '';
        if (name === void 0 || typeof name === 'string' && ~info.name.indexOf(name) || name instanceof RegExp && name.test(info.name)) {
            return ext === void 0 || typeof ext === 'string' && ext === iext || ext instanceof RegExp && ext.test(iext);
        }
        return false;
    };
    return Loader;
}());

var fileLoader = function (option) {
    if (option === void 0) { option = {
        path: './',
        ext: '',
        mode: 'BFS',
        deep: false,
        readFile: false
    }; }
    var loader = new Loader(Object.assign({}, option));
    return loader.search(loader.option.path).then(function () {
        typeof loader.option.done === 'function' && loader.option.done();
    }).catch(function (err) {
        typeof loader.option.error === 'function' && loader.option.error(err);
    });
};

exports.default = fileLoader;
exports.fileLoader = fileLoader;
