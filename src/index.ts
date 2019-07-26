import { Option } from '../'
import Loader from './loader';
export const fileLoader = (option: Option = {
  path: './',
  ext: '',
  deep: false,
  readFile: false
}) => {
  let loader = new Loader(Object.assign({}, option))
  return loader.search(loader.option.path).then(() => {
    typeof loader.option.done === 'function' && loader.option.done()
  }).catch(err => {
    typeof loader.option.error === 'function' && loader.option.error(err);
  })
}

export default fileLoader
