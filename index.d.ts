export interface Option {
  path?: string;
  ext?: string | RegExp,
  name?: string | RegExp,
  mode?: string,
  deep?: boolean;
  showDir?: boolean;
  readFile?: boolean;
  include?: string | RegExp;
  exclude?: string | RegExp;
  done?: () => void;
  error?: (error: Error) => void;
  loader?: (stats: {
    [prop: string]: any
  }, data: any, next: Function) => void;
}
/**
 * 文件加载器
 * @param option 
 * @param option.path 开始路径(相对于项目目录)
 * @param option.name 要处理的文件名
 * @param option.ext 要处理的文件类型
 * @param option.mode 遍历模式 深度/广度优先
 * @param option.deep 是否深层遍历
 * @param option.readFile 是否读取文件内容
 * @param option.include 包含路径
 * @param option.exclude 排除路径
 * @param option.loader 加载器
 * @param option.error 出错
 * @param option.done 完成
 */
export declare function fileLoader(option: {
  path?: string;
  name?: string | RegExp,
  ext?: string | RegExp,
  mode?: string,
  deep?: boolean;
  showDir?: boolean;
  readFile?: boolean;
  include?: string | RegExp;
  exclude?: string | RegExp;
  done?: () => void;
  error?: (error: Error) => void;
  loader?: (stats: {
    [prop: string]: any
  }, data: any, next: Function) => void;
}): Promise<any>;

export default fileLoader;
