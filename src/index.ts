import { Option } from '../'
import Loader from './loader'
export const fileLoader = (option: Option = {}) => {
  let loader = new Loader(Object.assign({
    path: './',
    name: '',
    ext: '',
    mode: 'BFS',
    deep: false,
    readFile: false
  }, 
  option.output ? { 
    deep: true,
    readFile: true
  } : {}, 
  option,
  option.output ? { showDir: false } : {}))
  return loader.search(loader.option.path).then(() => {
    typeof loader.option.done === 'function' && loader.option.done()
  }).catch(err => {
    typeof loader.option.error === 'function' && loader.option.error(err)
  })
}

export default fileLoader
