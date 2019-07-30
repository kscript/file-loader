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
| ext | string / RegExp | '' | 要处理文件类型 |
| mode | string | 'BFS' | 遍历模式: 深度优先(DFS)/广度优先(BFS) |
| exclude | string / RegExp | - | 排除路径. 没有被排除的文件才会被加载 |
| include | string / RegExp | - | 包含路径. 默认排除 node_modules 这样的大文件夹, 如果要加载, 须在include中指定 |
| deep | boolean | false | 是否深层遍历 |
| readFile | boolean | false | 是否读取文件内容 |
| error | function | - | 处理出错时的回调. |
| done | function | - | 处理完毕时的回调. 参数( - ) |
| loader | function | - | 加载器. 参数( stats: 文件信息 data: 文件内容 next: 处理完成时要执行的回调 ) |

#### 如何使用?

案例: 用 hexo 生成的博客, 在源码中有大量的空行, 使用
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

  // 包含目录
  // 默认会排除 node_modules 这样的大文件夹, 如果要加载, 必须在include中指定
  // include: /2018/,

  // 排除目录
  exclude: /lib/,

  // 是否深层遍历
  deep: true,

  // 是否读取文件内容
  readFile: true,
  /**
   * 加载器
   * @param {object} stats 文件信息
   * @param {string} data 文件内容 readFile 为 false 时返回空字符串
   * @param {function} next 文件处理完毕的回调 (必要的)
   */
  loader: function(stats, data, next){
    // do something..
    // 替换多余的空行
    var content = data.replace(/\n(\s+)\n+/g, '\n');
    // 写入文件
    fs.writeFile(stats.path, content, function(error){
      if(error){
        console.log(error);
      }
      next();
    });
  },
  // 转换完毕
  done: function(){
    console.log('complete');
  }
});
```

#### lisence
MIT
