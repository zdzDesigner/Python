import { methods } from './method.js'

export const bookList = async () => {
  const data = await methods.get('/books')
  // 转换数据格式以匹配现有的UI
  return data.map((book) => ({
    id: book.id,
    title: book.name || `小说 ${book.id}`,
    description: book.describe || '暂无描述',
    cover: `/${book.bg}` || null
  }))
}
