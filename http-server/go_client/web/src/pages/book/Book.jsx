import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Typography, Button, Spin, Alert, Modal, Input, Form, Upload, message, Popconfirm } from 'antd'
import { TPLLoading } from '@/components/Loadding'
import { PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import api from '@/utils/api'
import { bookList, deleteBook } from '@/service/api/book'
import './style.css'

const { Title, Text } = Typography

export const AudioBook = () => {
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [coverFile, setCoverFile] = useState(null)
  const [previewCover, setPreviewCover] = useState(null)

  // 获取小说数据
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true)
        // 使用专门的小说API获取数据
        setBooks(await bookList())
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

  // 处理文件上传变化
  const handleCoverChange = (info) => {
    if (info.file.status === 'removed') {
      setCoverFile(null)
      setPreviewCover(null)
    } else {
      // 获取文件对象 - 使用 info.file.originFileObj 或 info.file 作为备选
      const file = info.file.originFileObj || info.file
      if (file && file instanceof File) {
        setCoverFile(file)
        // Preview cover
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviewCover(e.target.result)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  // 处理模态框确认
  const handleOk = async () => {
    try {
      const values = await form.validateFields()

      // 直接上传文件到服务器
      if (coverFile) {
        const formData = new FormData()
        formData.append('file', coverFile)

        try {
          const uploadResponse = await fetch('http://localhost:8081/api/upload', {
            method: 'POST',
            body: formData
          })

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            // 使用返回的文件路径
            values.cover = uploadResult.path
          } else {
            message.error('文件上传失败')
            return
          }
        } catch (uploadError) {
          message.error('文件上传失败')
          return
        }
      }

      // 调用后端API添加新小说
      const bookData = {
        name: values.title,
        describe: values.description || '',
        bg: values.cover || '',
        size: 0
      }

      const response = await api.post('/books', bookData)

      if (response.status === 'success') {
        message.success('小说添加成功')
        // 添加成功后重新获取小说列表
        setBooks(await bookList())
        setIsModalVisible(false)
        form.resetFields()
        setCoverFile(null)
        setPreviewCover(null)
      } else {
        message.error('添加小说失败')
      }
    } catch (err) {
      console.error('添加小说失败:', err)
      message.error('添加小说失败')
    }
  }

  // 处理删除小说
  const handleDeleteBook = async (id) => {
    try {
      await deleteBook(id);
      // 删除成功后重新获取小说列表
      setBooks(await bookList());
      message.success('小说删除成功');
    } catch (err) {
      console.error('删除小说失败:', err);
      message.error('删除小说失败');
    }
  };

  // 处理模态框取消
  const handleCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
    setCoverFile(null)
    setPreviewCover(null)
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
            <div key={book.id} className="card-hover w-[150px]">
              <Card
                hoverable
                size="small"
                className="shadow-sm transition-shadow duration-300 h-full relative"
                cover={
                  book.cover ? (
                    <img alt={book.title} src={book.cover} className="h-32 object-cover" />
                  ) : (
                    <div className="text-center bg-gray-200 h-32 flex items-center justify-center">
                      <Text type="secondary">暂无封面</Text>
                    </div>
                  )
                }
              >
                {/* Action buttons - only show on hover */}
                <div className="absolute actions top-2 right-2 left-2 flex gap-1 opacity-0 transition-opacity duration-300">
                  <Button 
                    type="primary" 
                    shape="circle" 
                    icon={<EditOutlined />} 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement edit functionality
                      console.log('Edit book:', book);
                    }} 
                  />
                  <div className="flex-1" />
                  <Popconfirm 
                    title="删除小说" 
                    description="确定要删除这本小说吗？" 
                    onConfirm={(e) => {
                      e.stopPropagation();
                      handleDeleteBook(book.id);
                    }} 
                    okText="确定" 
                    cancelText="取消"
                  >
                    <Button 
                      type="primary" 
                      danger 
                      shape="circle" 
                      icon={<DeleteOutlined />} 
                      size="small" 
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
                <div onClick={() => bookClick(book)}>
                  <Card.Meta title={book.title} description={book.description} />
                </div>
              </Card>
            </div>
          ))}
          <div className="w-[150px]">
            <Card hoverable className="shadow-sm transition-shadow duration-300 h-full flex flex-col items-center justify-center" onClick={showModal}>
              <div className="flex flex-col h-full cursor-pointer">
                <div className="flex-1" />
                <div className="text-6xl text-center text-gray-200">+</div>
                <div className="flex-1" />
              </div>
              <br />
            </Card>
          </div>
        </div>
      </div>

      {/* 添加小说模态框 */}
      <Modal title="添加新小说" open={isModalVisible} onOk={handleOk} onCancel={handleCancel} okText="确认" cancelText="取消">
        <Form form={form} labelCol={{ span: 4 }}>
          <Form.Item name="title" label="小说标题" rules={[{ required: true, message: '请输入小说标题' }]}>
            <Input placeholder="请输入小说标题" />
          </Form.Item>
          <Form.Item name="description" label="小说描述">
            <Input.TextArea placeholder="请输入小说描述" rows={3} />
          </Form.Item>
          <Form.Item label="上传封面">
            <Upload beforeUpload={() => false} onChange={handleCoverChange} showUploadList={false} accept="image/*">
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            {previewCover && (
              <div className="mt-2">
                <img src={previewCover} alt="Preview" className="w-16 h-16 object-cover" />
              </div>
            )}
          </Form.Item>
          <Form.Item name="cover" label="封面URL">
            <Input placeholder="或输入封面图片URL" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
