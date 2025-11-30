import React, { useState, useEffect } from 'react'
import { Button, Modal, Form, Input, Upload, message, Popconfirm } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import { fetchVoices, createVoice, updateVoice, deleteVoice } from '@/service/api/dubbing'

// Voice Card Component
const VoiceCard = ({ voice, onEdit, onDelete }) => {
  const [hovered, setHovered] = useState(false)

  // Construct full URL for avatar if it's a relative path
  const getAvatarUrl = () => {
    if (!voice.avatar) return null
    if (voice.avatar.startsWith('http')) {
      return voice.avatar
    }
    // Assuming the avatar is served from the backend
    return `http://localhost:8081/${voice.avatar}`
  }

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '6px',
        margin: '8px',
        width: '140px',
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        position: 'relative',
        transition: 'box-shadow 0.3s'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Action buttons - only show on hover */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '4px',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s'
        }}
      >
        <Button type="primary" shape="circle" icon={<EditOutlined />} size="small" onClick={() => onEdit(voice)} />
        <Popconfirm title="删除音色" description="确定要删除这个音色吗？" onConfirm={() => onDelete(voice.id)} okText="确定" cancelText="取消">
          <Button type="primary" danger shape="circle" icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      </div>

      {/* Avatar */}
      <div
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          overflow: 'hidden',
          margin: '0 auto 12px',
          border: '2px solid #eee'
        }}
      >
        {voice.avatar ? (
          <img src={getAvatarUrl()} alt={voice.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              color: '#999'
            }}
          >
            <UserOutlined />
          </div>
        )}
      </div>

      {/* Name and Age */}
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {voice.name} · {voice.age_text}
      </div>

      {/* Emotion Text */}
      <div
        style={{
          color: '#666',
          minHeight: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {voice.emotion_text}
      </div>
    </div>
  )
}

// Voice Form Modal Component
const VoiceFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form] = Form.useForm()
  const [avatarFile, setAvatarFile] = useState(null)
  const [wavFile, setWavFile] = useState(null)
  const [previewAvatar, setPreviewAvatar] = useState(null)

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        name: initialData.name || '',
        age_text: initialData.age_text || '',
        emotion_text: initialData.emotion_text || '',
        avatar: initialData.avatar || '',
        wav_path: initialData.wav_path || ''
      })
      setPreviewAvatar(initialData.avatar || null)
      setAvatarFile(null)
      setWavFile(null)
    } else {
      form.resetFields()
      setPreviewAvatar(null)
      setAvatarFile(null)
      setWavFile(null)
    }
  }, [initialData, isOpen, form])

  const handleFileChange = (info, setFile, setPreview) => {
    if (info.file.status === 'done') {
      setFile(info.file.originFileObj)
      if (setPreview) {
        // Preview avatar
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreview(e.target.result)
        }
        reader.readAsDataURL(info.file.originFileObj)
      }
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`)
    }
  }

  const handleSubmit = (values) => {
    onSubmit(values, avatarFile, wavFile)
  }

  const avatarUploadProps = {
    beforeUpload: () => false, // Prevent automatic upload
    onChange: (info) => handleFileChange(info, setAvatarFile, setPreviewAvatar),
    showUploadList: false,
    accept: 'image/*'
  }

  const wavUploadProps = {
    beforeUpload: () => false, // Prevent automatic upload
    onChange: (info) => handleFileChange(info, setWavFile),
    showUploadList: false,
    accept: 'audio/wav,audio/mp3'
  }

  return (
    <Modal title={initialData ? '编辑音色' : '新增音色'} open={isOpen} onCancel={onClose} footer={null} width={400}>
      <Form labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} form={form} layout="horizontal" onFinish={handleSubmit}>
        <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="请输入名称" />
        </Form.Item>

        <Form.Item name="age_text" label="年龄文本" rules={[{ required: true, message: '请输入年龄文本' }]}>
          <Input placeholder="请输入年龄文本" />
        </Form.Item>

        <Form.Item name="emotion_text" label="情感文本" rules={[{ required: true, message: '请输入情感文本' }]}>
          <Input placeholder="请输入情感文本" />
        </Form.Item>

        <Form.Item label="上传头像">
          <Upload {...avatarUploadProps}>
            <Button icon={<PlusOutlined />}>选择文件</Button>
          </Upload>
          {previewAvatar && (
            <div style={{ marginTop: '8px' }}>
              <img src={previewAvatar} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
            </div>
          )}
        </Form.Item>

        <Form.Item label="上传音频">
          <Upload {...wavUploadProps}>
            <Button icon={<PlusOutlined />}>选择文件</Button>
          </Upload>
        </Form.Item>

        <Form.Item label={null}>
          <Button type="primary" htmlType="submit" block>
            {initialData ? '更新' : '创建'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}

// Main Dubbing Component
export const DubbingList = () => {
  const [voices, setVoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVoice, setEditingVoice] = useState(null)

  // Load voices on component mount
  useEffect(() => {
    loadVoices()
  }, [])

  const loadVoices = async () => {
    try {
      setLoading(true)
      const data = await fetchVoices()
      setVoices(data)
      setError(null)
    } catch (err) {
      setError('加载音色列表失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVoice = async (voiceData, avatarFile, wavFile) => {
    try {
      await createVoice(voiceData, avatarFile, wavFile)
      setIsModalOpen(false)
      loadVoices() // Refresh the list
    } catch (err) {
      message.error('创建音色失败')
      console.error(err)
    }
  }

  const handleUpdateVoice = async (voiceData, avatarFile, wavFile) => {
    try {
      await updateVoice(editingVoice.id, voiceData, avatarFile, wavFile)
      setIsModalOpen(false)
      setEditingVoice(null)
      loadVoices() // Refresh the list
    } catch (err) {
      message.error('更新音色失败')
      console.error(err)
    }
  }

  const handleDeleteVoice = async (id) => {
    try {
      await deleteVoice(id)
      loadVoices() // Refresh the list
      message.success('删除成功')
    } catch (err) {
      message.error('删除音色失败')
      console.error(err)
    }
  }

  const handleEditClick = (voice) => {
    setEditingVoice(voice)
    setIsModalOpen(true)
  }

  const handleAddClick = () => {
    setEditingVoice(null)
    setIsModalOpen(true)
  }

  const handleSubmit = (formData, avatarFile, wavFile) => {
    if (editingVoice) {
      handleUpdateVoice(formData, avatarFile, wavFile)
    } else {
      handleCreateVoice(formData, avatarFile, wavFile)
    }
  }

  if (loading) {
    return <div>加载中...</div>
  }

  if (error) {
    return <div>错误: {error}</div>
  }

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <h1>音色管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick} size="large">
          新增音色
        </Button>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {voices.map((voice) => (
          <VoiceCard key={voice.id} voice={voice} onEdit={handleEditClick} onDelete={handleDeleteVoice} />
        ))}

        {voices.length === 0 && !loading && (
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              padding: '40px',
              color: '#666'
            }}
          >
            暂无音色数据，请添加新的音色
          </div>
        )}
      </div>

      <VoiceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingVoice(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingVoice}
      />
    </div>
  )
}
