import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Typography, Button, Spin, Alert, Modal, Input, Form } from 'antd'
import { TPLLoading } from '@/components/Loadding'
import api from '@/utils/api'

const { Title, Text } = Typography

export const AudioBook = () => {
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()

  // 获取小说数据
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true)
        // 使用专门的小说API获取数据
        const booksData = await api.get('/books')

        // 转换数据格式以匹配现有的UI
        const formattedBooks = booksData.map((book) => ({
          id: book.id,
          title: book.name || `小说 ${book.id}`,
          description: book.describe || '暂无描述',
          cover: book.bg || null
        }))

        setBooks(formattedBooks)
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
    // console.log({ book })
    navigate(`/audiobook/${book.id}/section/0`, { state: { key: book.title } })
  }

  // 显示添加小说模态框
  const showModal = () => {
    setIsModalVisible(true)
  }

  // 处理模态框确认
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      // 调用后端API添加新小说
      const response = await api.post('/books', {
        name: values.title,
        describe: values.description || '',
        bg: values.cover || '',
        size: 0
      })

      if (response.code === 0) {
        // 添加成功后重新获取小说列表
        const booksData = await api.get('/books')

        // 转换数据格式以匹配现有的UI
        const formattedBooks = booksData.map((book) => ({
          id: book.id,
          title: book.name || `小说 ${book.id}`,
          description: book.describe || '暂无描述',
          cover: book.bg || null
        }))

        setBooks(formattedBooks)
        setIsModalVisible(false)
        form.resetFields()
      }
    } catch (err) {
      console.error('添加小说失败:', err)
    }
  }

  // 处理模态框取消
  const handleCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
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
            <Card hoverable className="shadow-sm transition-shadow duration-300 h-full flex flex-col items-center justify-center" onClick={showModal}>
              <div className="text-8xl text-center text-gray-200" style={{ lineHeight: '1em' }}>
                +
              </div>
              <br />
            </Card>
          </div>
        </div>
      </div>

      {/* 添加小说模态框 */}
      <Modal title="添加新小说" open={isModalVisible} onOk={handleOk} onCancel={handleCancel} okText="确认" cancelText="取消">
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="小说标题" rules={[{ required: true, message: '请输入小说标题' }]}>
            <Input placeholder="请输入小说标题" />
          </Form.Item>
          <Form.Item name="description" label="小说描述">
            <Input.TextArea placeholder="请输入小说描述" rows={3} />
          </Form.Item>
          <Form.Item name="cover" label="封面图片URL">
            <Input placeholder="请输入封面图片URL" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
