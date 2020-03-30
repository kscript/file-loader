### ks-file-loader
一个文件加载器

#### 安装
```npm
  npm i ks-file-loader -D
```

#### Api

| 属性 | 类型 | 默认值 | 说明 |
|--|--|--|--|
| path | string | './' | 要处理目录(相对于项目目录, 而非文件所在目录) |
| name | string / RegExp | '' | 要处理文件名 |
| fullName | string / RegExp | '' | 要处理文件 (文件名+扩展名) |
| ext | string / RegExp | '' | 要处理文件类型 |
| mode | string | 'BFS' | 遍历模式: 深度优先(DFS)/广度优先(BFS) |
| exclude | string / RegExp | - | 排除路径. 没有被排除的文件才会被加载 |
| include | string / RegExp | - | 包含路径. 默认排除 node_modules 这样的大文件夹, 如果要加载, 须在include中指定 |
| deep | boolean | false | 是否深层遍历 |
| async | boolean | false | 当不深层遍历时, 是否异步加载 (异步时使用Promise.all加载, 不采用异步可以保持顺序) |
| showDir | boolean | false | 文件夹是否经过loader |
| readFile | boolean | false | 是否读取文件内容 |
| output | string / Function | - | 输出文件名 |
| outputDir | string | - | 输出文件夹名 |
| error | function | - | 处理出错时的回调 |
| done | function | - | 处理完毕时的回调 |
| loader | function | - | 加载器. 参数( stats: 文件信息 data: 文件内容 done: 处理完成时要执行的回调) |

> loader函数有异步操作时, 有两种方式: 1、回调函数 2、Promise(推荐).  
  当执行loader函数后, 返回值  
  为 Promise 时, loader会先等待Promise执行完毕  
  为 false 时, 等待用户手动调用 done  
  为其它值时, 则继续执行  

> 设置了fullName时, 不再验证文件名和扩展名

> output 有字符串和函数两种形式
  - 值为字符串时
    匹配规则为\[(.*?)(path|dir|name|hash|ext)(.*?)\](\?|)
    [{前缀}{精确匹配}{后缀}]{?表示精确匹配为空时, 输出空字符串}
  - 值为函数时, 等同于loader, 但如果返回了一个字符串, 那么则会进入 值为字符串 时的流程
    

#### 如何使用?

案例1: 用 hexo 生成的博客, 在源码中有大量的空行, 使用
```js
// 调用示例
const fs = require("fs");
const fileLoader = require('ks-file-loader')

fileLoader({

  // 要进行转换的目录
  // 相对于项目目录, 而非文件所在目录
  path: './public',

  // 文件扩展名, 支持正则
  ext: 'html',

  // 文件名, 支持正则
  // name: '',

  // 完整文件名, 支持正则 (验证文件名 + 扩展名)
  // fullName: ''

  // 包含目录
  // 默认会排除 node_modules 这样的大文件夹, 如果要加载, 必须在include中指定
  // include: /2018/,

  // 排除目录
  exclude: /lib/,

  // 遍历模式: 广度优先(BFS) / 深度优先(DFS)
  mode: 'DFS',

  // 是否深层遍历
  deep: true,

  // 是否读取文件内容
  readFile: true,
  /**
   * 加载器
   * @param {object} stats 文件信息
   * @param {string} data 文件内容 readFile 为 false 时返回空字符串
   * @param {function} done 文件处理完毕的回调
   * @return {Promise|false|any} Promise: 使用Promise处理异步  false: 使用回调函数处理异步(处理完需手动调用done) 其它值: 默认为同步
   */
  loader: function(stats, data, done) {
    
    // do something..
    // 替换多余的空行
    var content = data.replace(/\n(\s+)\n+/g, '\n');

    // Promise方式处理异步操作
    return new Promise((resolve, reject) {
      fs.writeFile(stats.path, content, function(error){
        if(error){
          // 处理出错时, 即便通过reject抛出了错误, 也会被忽略, 因此需要用户自己先行处理错误
          reject(error);
        } else {
          resolve();
        }
      });
    });
    // 回调函数方式处理异步操作
    // 写入文件
    fs.writeFile(stats.path, content, function(error){
      if(error){
        console.log(error);
      }
      done();
    });
    // 返回值必须全等于false
    return false;
  },
  // 转换完毕
  done: function(){
    console.log('complete');
  }
});
```

案例2: 给指定类型的文件加hash
```js
const fileLoader = require('ks-file-loader')
fileLoader({
  ext: /^(js|ts)$/,
  // output: '[dir/][name-]?[hash][.ext]',
  output: function(stats) {
    let name = /\.d\.ts$/.test(stats.path) ? stats.name.slice(0, -2) + '-[hash].d' : '[name-]?[hash]'
    return '[dir/]' + name + '[.ext]'
  }
})
```

#### lisence
MIT
