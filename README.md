### file-loader
一个文件加载器

#### 安装
```npm
  // 注意有ks前缀
  npm i ks-file-loader -D
```

#### 如何使用?

案例: 用 hexo 生成的博客, 在源码中有大量的空行, 使用
```js
// 调用示例
const fs = require("fs");
const fileLoader = require('ks-file-loader')

fileLoader({

  // 要进行转换的目录
  path: './public',

  // 文件扩展名, 支持正则
  ext: 'html',

  // 包含目录
  // 如果要加载node_modules文件夹, 必须在include中指定
  // include: /2018/,

  // 排除目录
  exclude: /lib/,

  /**
   * 加载器
   * @param {object} stats 文件信息
   * @param {string} data 文件内容
   */
  loader: function(stats, data){
    // do something..
    // 替换多余的空行
    var content = data.replace(/\n(\s+)\n+/g, '\n');
    // 写入文件
    fs.writeFile(stats.path, content, function(error){
      if(error){
        console.log(error);
      }
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
