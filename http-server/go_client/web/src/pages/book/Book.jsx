import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Typography, Button, Spin, Alert } from 'antd'
import { TPLLoading } from '@/components/Loadding'
import api from '@/utils/api'

const { Title, Text } = Typography

export const AudioBook = () => {
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 获取小说数据
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true)
        // 由于目前没有专门的小说API，我们通过获取章节来推断小说信息
        const sections = await api.get('/sections')

        // 从章节数据中提取唯一的小说信息
        const uniqueBooks = [
          ...new Map(
            sections.map((section) => [
              section.book_id,
              {
                id: section.book_id,
                title: `小说 ${section.book_id}`,
                description: `包含 ${sections.filter((s) => s.book_id === section.book_id).length} 个章节`,
                cover: null
              }
            ])
          ).values()
        ]

        setBooks(uniqueBooks)
      } catch (err) {
        setError('获取小说数据失败')
        console.error('Error fetching books:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [])

  // 处理小说点击
  const bookClick = (book) => {
    navigate(`/audiobook/${book.id}/section/1`)
  }

  if (loading) {
    return TPLLoading()
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Alert message="错误" description={error} type="error" showIcon />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 cursor-default">
      {/* 小说列表 */}
      <div className="flex-grow overflow-auto p-4">
        <div className="flex flex-wrap gap-4">
          {books.map((book) => (
            <div key={book.id} className="w-[150px]">
              <Card
                hoverable
                size="small"
                className="shadow-sm transition-shadow duration-300 h-full"
                cover={
                  book.cover ? (
                    <img alt={book.title} src={book.cover} className="h-32 object-cover" />
                  ) : (
                    <div className="text-center bg-gray-200 h-32 flex items-center justify-center">
                      <Text type="secondary">暂无封面</Text>
                    </div>
                  )
                }
                onClick={() => bookClick(book)}
              >
                <Card.Meta title={book.title} description={book.description} />
              </Card>
            </div>
          ))}
          <div className="w-[150px]">
            <Card
              hoverable
              className="shadow-sm transition-shadow duration-300 h-full flex flex-col items-center justify-center"
              onClick={() => console.log('添加新小说')}
            >
              <div className="text-8xl text-center text-gray-200" style={{ lineHeight: '1em' }}>
                +
              </div>
              <br />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
