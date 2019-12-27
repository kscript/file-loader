'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var path = require('path');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var hashFile = require('hash-file');
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
                var queue = Promise.all(filelists.map(function (filename) {
                    return _this.machining(filePath, filename, false).then(function (type) {
                        return type === 'dir' ? path.join(filePath, filename) : '';
                    });
                }));
                return _this.option.deep ? queue.then(function (rest) {
                    var dirs = rest.filter(function (filePath) { return !!filePath; });
                    return Promise.all(dirs.map(function (item) {
                        return _this.search(item);
                    }));
                }) : queue;
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
     * @param {boolean} deep 是否深度遍历
     */
    Loader.prototype.machining = function (filePath, filename, deep) {
        var _this = this;
        if (deep === void 0) { deep = this.option.deep; }
        var option = this.option;
        return new Promise(function (resolve, reject) {
            if (!/^(\/|\\)$/.test(filename)) {
                var current_1 = path.join(filePath, filename);
                _this.getStats(current_1)
                    .then(function (stats) {
                    if (stats.isFile()) {
                        if (_this.verifyFile(current_1, option.ext, option.name)) {
                            var names = filename.split('.');
                            // 文件需要等处理完的回调
                            return _this.loaderHandler(Object.assign({}, stats, {
                                type: 'file',
                                ext: names.slice(-1)[0] || '',
                                dir: filePath,
                                path: current_1,
                                name: names.slice(0, -1).join('.') || ''
                            }), function () {
                                resolve('file');
                            });
                        }
                    }
                    else if (stats.isDirectory()) {
                        if (_this.verifyDir(option.include, option.exclude, current_1)) {
                            return _this.loaderHandler(Object.assign({}, stats, {
                                type: 'dir',
                                ext: '',
                                dir: filePath,
                                path: current_1,
                                name: filename
                            }), function () {
                                if (deep) {
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
        var _this = this;
        var option = this.option;
        var loader = option.loader;
        error = error || option.error;
        if (typeof loader === 'function' || option.output) {
            if (stats.isDir || stats.type === 'dir') {
                if (!option.ext || option.showDir) {
                    this.execLoader(loader, done, stats, '');
                }
                else {
                    done();
                }
            }
            else if (option.readFile) {
                fs.readFile(stats.path, 'utf8', function (err, data) {
                    if (err) {
                        error && done(error(err, stats));
                    }
                    else {
                        _this.execLoader(loader, done, stats, data);
                    }
                });
            }
            else {
                this.execLoader(loader, done, stats, '');
            }
        }
        else {
            done();
        }
    };
    Loader.prototype.execLoader = function (loader, done, stats, data) {
        return __awaiter(this, void 0, Promise, function () {
            var outputRes, option, dir, output, func, result, hash, _a, maps_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        option = this.option;
                        dir = option.outputDir;
                        output = option.output;
                        if (!output || typeof output === 'function') {
                            func = output || loader;
                            result = func(stats, data, done);
                            if (output && typeof result === 'string') {
                                // 返回值为string时, 可以视为 string 类型的 output
                                outputRes = result;
                            }
                            else {
                                if (result instanceof Promise) {
                                    result.then(function () {
                                        done();
                                    }).catch(function () {
                                        done();
                                    });
                                }
                                else {
                                    if (result !== false) {
                                        done();
                                    }
                                    // 为false时, 需要用户自行调用done
                                }
                                return [2 /*return*/];
                            }
                        }
                        output = outputRes || output;
                        if (!(typeof output === 'string' && stats.type === 'file')) return [3 /*break*/, 4];
                        if (!/\[hash\]/.test(output)) return [3 /*break*/, 2];
                        return [4 /*yield*/, hashFile(stats.path)];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = '';
                        _b.label = 3;
                    case 3:
                        hash = (_a).slice(0, 8);
                        maps_1 = {
                            hash: hash,
                            name: stats.name,
                            path: stats.path,
                            dir: dir || stats.dir,
                            ext: stats.ext
                        };
                        fs.writeFile(output.replace(/\[(.*?)(path|dir|name|hash|ext)(.*?)\](\?|)/g, function (s, $1, $2, $3, $4) { return $4 && !maps_1[$2] ? '' : "" + $1 + maps_1[$2] + $3; }), data, function (err) { return void done(); });
                        _b.label = 4;
                    case 4:
                        done();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 对文件夹进行验证
     * @param {string|RegExp} include 包含的字符
     * @param {string|RegExp} loader 排除的字符
     * @param {string} name 文件夹名
     */
    Loader.prototype.verifyDir = function (include, exclude, name) {
        var isIgnore = /^(node_modules|.git|.log|.temp)$/.test(name);
        var isInclude = include instanceof RegExp ? include.test(name) : true;
        var isExclude = exclude instanceof RegExp ? exclude.test(name) : false;
        // 如果是 默认忽略的文件夹, 必须在 include 的正则表达式里指定, 否则忽略
        // 如果不是, 那么判断是否符合 包含且不排除
        return isIgnore ? include && isInclude : isInclude && !isExclude;
    };
    /**
     * 对文件进行验证
     * @param {string} filepath 文件路径
     * @param {string|RegExp} ext 扩展名
     */
    Loader.prototype.verifyFile = function (filepath, ext, name) {
        var info = path.parse(filepath);
        var iext = info.ext ? info.ext.slice(1) : '';
        var fullName = this.option.fullName;
        // 解决.d.ts
        if (typeof fullName === 'string') {
            return fullName ? (info.name + info.ext).indexOf(fullName) > 0 : !!1;
        }
        else if (fullName instanceof RegExp) {
            return fullName.test(info.name + info.ext);
        }
        if (name && typeof name === 'string' ? ~info.name.indexOf(name) : name instanceof RegExp ? name.test(info.name) : !!1) {
            return ext && typeof ext === 'string' ? ext === iext : ext instanceof RegExp ? ext.test(iext) : !!1;
        }
    };
    return Loader;
}());

var fileLoader = function (option) {
    if (option === void 0) { option = {}; }
    var loader = new Loader(Object.assign({
        path: './',
        name: '',
        ext: '',
        mode: 'BFS',
        deep: false,
        readFile: false
    }, option.output ? {
        deep: true,
        readFile: true
    } : {}, option, option.output ? { showDir: false } : {}));
    return loader.search(loader.option.path).then(function () {
        typeof loader.option.done === 'function' && loader.option.done();
    }).catch(function (err) {
        typeof loader.option.error === 'function' && loader.option.error(err);
    });
};

exports.default = fileLoader;
exports.fileLoader = fileLoader;
