import React, { useState, useEffect, useRef } from 'react'
import { Button, Modal, Form, Input, Upload, message, Popconfirm, Spin, Progress } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined, PlayCircleOutlined, PauseCircleOutlined, UploadOutlined } from '@ant-design/icons'
import { fetchVoices, createVoice, updateVoice, deleteVoice, batchUploadVoices } from '@/service/api/dubbing'
import './style.css'

export const CSS_CARD = 'border border-gray-300 rounded-lg p-4 w-36 text-center shadow-sm bg-white relative transition-shadow duration-300 hover:shadow-md'

// Voice Card Component
const VoiceCard = ({ voice, onEdit, onDelete }) => {
  const [hovered, setHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  // Construct full URL for avatar if it's a relative path
  const getAvatarUrl = () => {
    if (!voice.avatar) return null
    return voice.avatar
  }

  // Construct full URL for audio if it's a relative path
  const getAudioUrl = () => {
    if (!voice.wav_path) return null
    return voice.wav_path
  }

  const togglePlay = () => {
    const audioUrl = getAudioUrl()
    if (!audioUrl) return

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => {
        setIsPlaying(false)
        audioRef.current = null
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return (
    <div className={`${CSS_CARD} ${hovered && 'card-hover'}`} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* Action buttons - only show on hover    ${hovered ? 'opacity-100' : 'opacity-0'} */}
      <div className={`absolute left-0 w-full z-100 top-2 right-2 flex gap-1 transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        <Button className="ml-[10px]" type="primary" shape="circle" icon={<EditOutlined />} size="small" onClick={() => onEdit(voice)} />
        <div className="flex-1" />
        <Popconfirm title="删除音色" description="确定要删除这个音色吗？" onConfirm={() => onDelete(voice.id)} okText="确定" cancelText="取消">
          <Button className="mr-[10px]" type="primary" danger shape="circle" icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      </div>

      {/* Avatar */}
      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border-2 border-gray-200 relative">
        {voice.avatar ? (
          <img src={getAvatarUrl()} alt={voice.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl text-gray-500">
            <UserOutlined />
          </div>
        )}

        {/* Audio Player Overlay - only show if audio exists */}
        {voice.wav_path && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full cursor-pointer  duration-300  hover:bg-black/10"
            onClick={(e) => {
              e.stopPropagation()
              togglePlay()
            }}
          >
            <Button
              className="playing opacity-0"
              type="default"
              shape="circle"
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              size="large"
            />
          </div>
        )}
      </div>

      {/* Name and Age */}
      <div className="font-bold mb-1 text-sm">
        {voice.name} · {voice.age_text}
      </div>

      {/* Emotion Text */}
      <div className="text-gray-600 min-h-1 items-center justify-center text-xs">{voice.emotion_text}</div>
    </div>
  )
}

// Voice Form Modal Component
const VoiceFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form] = Form.useForm()
  const [avatarFile, setAvatarFile] = useState(null)
  const [wavFile, setWavFile] = useState(null)
  const [previewAvatar, setPreviewAvatar] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

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
      // Set audio URL for existing voice
      if (initialData.wav_path) {
        setAudioUrl(initialData.wav_path)
      } else {
        setAudioUrl(null)
      }
      setIsPlaying(false)
    } else {
      form.resetFields()
      setPreviewAvatar(null)
      setAvatarFile(null)
      setWavFile(null)
      setAudioUrl(null)
      setIsPlaying(false)
    }
  }, [initialData, isOpen, form])

  const handleFileChange = (info, setFile, setPreview, isAudio = false) => {
    if (info.file.status === 'removed') {
      setFile(null)
      if (setPreview) {
        setPreview(null)
      }
      if (isAudio) {
        setAudioUrl(null)
        setIsPlaying(false)
      }
    } else {
      // 获取文件对象 - 使用 info.file.originFileObj 或 info.file 作为备选
      const file = info.file.originFileObj || info.file
      if (file && file instanceof File) {
        setFile(file)
        if (setPreview) {
          // Preview avatar
          const reader = new FileReader()
          reader.onload = (e) => {
            setPreview(e.target.result)
          }
          reader.readAsDataURL(file)
        }
        // For audio files, create object URL for playback
        if (isAudio) {
          const url = URL.createObjectURL(file)
          setAudioUrl(url)
          setIsPlaying(false)
        }
      }
    }
  }

  const handleSubmit = async (values) => {
    try {
      // Handle avatar file upload
      if (avatarFile) {
        const avatarFormData = new FormData()
        avatarFormData.append('file', avatarFile)

        const avatarResponse = await fetch('/api/upload', {
          method: 'POST',
          body: avatarFormData
        })

        if (avatarResponse.ok) {
          const avatarResult = await avatarResponse.json()
          values.avatar = avatarResult.path
        } else {
          message.error('头像上传失败')
          return
        }
      }

      // Handle audio file upload
      if (wavFile) {
        const audioFormData = new FormData()
        audioFormData.append('file', wavFile)

        const audioResponse = await fetch('/api/upload', {
          method: 'POST',
          body: audioFormData
        })

        if (audioResponse.ok) {
          const audioResult = await audioResponse.json()
          values.wav_path = audioResult.path
        } else {
          message.error('音频文件上传失败')
          return
        }
      }

      onSubmit(values, avatarFile, wavFile)
    } catch (err) {
      console.error('文件上传失败:', err)
      message.error('文件上传失败')
    }
  }

  const avatarUploadProps = {
    beforeUpload: () => false, // Prevent automatic upload
    onChange: (info) => handleFileChange(info, setAvatarFile, setPreviewAvatar),
    showUploadList: false,
    accept: 'image/*'
  }

  const wavUploadProps = {
    beforeUpload: () => false, // Prevent automatic upload
    onChange: (info) => handleFileChange(info, setWavFile, null, true),
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
            <div className="mt-2">
              <img src={previewAvatar} alt="Preview" className="w-12 h-12 rounded-full" />
            </div>
          )}
        </Form.Item>

        <Form.Item label="上传音频">
          <Upload {...wavUploadProps}>
            <Button icon={<PlusOutlined />}>选择文件</Button>
          </Upload>
          {audioUrl && (
            <Button
              className="ml-2"
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => {
                if (!audioRef.current) {
                  audioRef.current = new Audio(audioUrl)
                  audioRef.current.onended = () => {
                    setIsPlaying(false)
                  }
                }

                if (isPlaying) {
                  audioRef.current.pause()
                  setIsPlaying(false)
                } else {
                  audioRef.current.play()
                  setIsPlaying(true)
                }
              }}
            ></Button>
          )}
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
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [batchUploading, setBatchUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ total: 0, success: 0, failed: 0 })
  const [batchFiles, setBatchFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [playingFileIndex, setPlayingFileIndex] = useState(null)
  const fileInputRef = useRef(null)
  const audioRefs = useRef({})

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
      console.log({ editingVoice, voiceData })
      await updateVoice(editingVoice.id, { ...editingVoice, ...voiceData }, avatarFile, wavFile)
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

  const handleBatchUpload = () => {
    setIsBatchModalOpen(true)
    setBatchFiles([])
    setSelectedFiles([])
    setUploadProgress({ total: 0, success: 0, failed: 0 })
  }

  const getFileDisplayName = (file) => {
    const fullPath = file.webkitRelativePath || file.name
    const pathParts = fullPath.split('/')
    
    if (pathParts.length >= 2) {
      const dirName = pathParts[pathParts.length - 2]
      const fileName = pathParts[pathParts.length - 1]
      return `${dirName}/${fileName}`
    }
    return file.name
  }

  const handleBatchFileSelect = (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Filter audio files and prepare file list
    const audioFiles = Array.from(files).filter((file) => {
      const ext = file.name.toLowerCase()
      return ext.endsWith('.wav') || ext.endsWith('.mp3') || ext.endsWith('.m4a') || ext.endsWith('.flac') || ext.endsWith('.ogg')
    })

    if (audioFiles.length === 0) {
      message.warning('未找到音频文件')
      return
    }

    // Prepare file list with metadata
    const fileList = audioFiles.map((file, index) => ({
      file,
      displayName: getFileDisplayName(file),
      url: URL.createObjectURL(file),
      index
    }))

    setBatchFiles(fileList)
    setSelectedFiles(fileList.map((_, i) => i))
    setIsBatchModalOpen(true)
  }

  const toggleFileSelection = (index) => {
    setSelectedFiles((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const togglePlayAudio = (index) => {
    const audioElement = audioRefs.current[index]
    
    if (!audioElement) return

    if (playingFileIndex === index) {
      audioElement.pause()
      setPlayingFileIndex(null)
    } else {
      // Pause all other audio
      Object.keys(audioRefs.current).forEach((key) => {
        if (audioRefs.current[key]) {
          audioRefs.current[key].pause()
        }
      })
      
      audioElement.play()
      setPlayingFileIndex(index)
    }
  }

  const handleConfirmBatchUpload = async () => {
    const filesToUpload = selectedFiles.map((index) => batchFiles[index].file)
    
    if (filesToUpload.length === 0) {
      message.warning('请至少选择一个文件')
      return
    }

    setBatchUploading(true)
    setUploadProgress({ total: filesToUpload.length, success: 0, failed: 0 })

    try {
      const response = await batchUploadVoices(filesToUpload)
      
      setUploadProgress({
        total: response.data.total,
        success: response.data.success_count,
        failed: response.data.failed_count
      })

      message.success(`批量上传完成：成功 ${response.data.success_count} 个，失败 ${response.data.failed_count} 个`)
      
      // Refresh voice list
      loadVoices()
      
      // Clean up audio URLs
      batchFiles.forEach((item) => URL.revokeObjectURL(item.url))
      
      // Close modal after a short delay
      setTimeout(() => {
        setIsBatchModalOpen(false)
        setBatchFiles([])
        setSelectedFiles([])
      }, 2000)
    } catch (err) {
      message.error('批量上传失败')
      console.error(err)
    } finally {
      setBatchUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = (formData, avatarFile, wavFile) => {
    if (editingVoice) {
      handleUpdateVoice(formData, avatarFile, wavFile)
    } else {
      handleCreateVoice(formData, avatarFile, wavFile)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  if (error) {
    return <div className="p-5 text-red-500">错误: {error}</div>
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 cursor-default p-4">
        <div className="flex flex-wrap gap-4">
          {voices.map((voice) => (
            <VoiceCard key={voice.id} voice={voice} onEdit={handleEditClick} onDelete={handleDeleteVoice} />
          ))}
          <div className={`flex flex-col cursor-pointer border-dotted ${CSS_CARD}`}>
            <div className="flex-1" />
            <div className="flex flex-col gap-2 items-center justify-center">
              <div className="text-4xl text-center text-gray-400 hover:text-blue-500 transition-colors" onClick={handleAddClick}>
                <PlusOutlined />
              </div>
              <div className="text-xs text-gray-500">单独上传</div>
              <div className="border-t border-gray-300 w-20 my-1"></div>
              <div className="text-4xl text-center text-gray-400 hover:text-blue-500 transition-colors" onClick={triggerFileInput}>
                <UploadOutlined />
              </div>
              <div className="text-xs text-gray-500">批量上传</div>
            </div>
            <div className="flex-1" />
          </div>
          <br />

          {voices.length === 0 && !loading && <div className="w-full text-center py-10 text-gray-600">暂无音色数据，请添加新的音色</div>}
        </div>

        {/* Hidden file input for batch upload */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={handleBatchFileSelect}
        />

        {/* Batch Upload Modal */}
        <Modal
          title="批量上传音频文件"
          open={isBatchModalOpen}
          onCancel={() => !batchUploading && setIsBatchModalOpen(false)}
          width={700}
          footer={
            batchUploading
              ? null
              : batchFiles.length > 0
              ? [
                  <Button key="cancel" onClick={() => setIsBatchModalOpen(false)}>
                    取消
                  </Button>,
                  <Button key="upload" type="primary" onClick={handleConfirmBatchUpload} disabled={selectedFiles.length === 0}>
                    上传 ({selectedFiles.length} 个文件)
                  </Button>
                ]
              : [
                  <Button key="close" onClick={() => setIsBatchModalOpen(false)}>
                    关闭
                  </Button>
                ]
          }
        >
          <div className="py-4">
            {batchUploading ? (
              <div className="text-center">
                <Spin size="large" />
                <div className="mt-4">正在上传...</div>
                <div className="mt-2">
                  <div className="mb-2">总计: {uploadProgress.total} 个文件</div>
                  <div className="mb-2 text-green-600">成功: {uploadProgress.success} 个</div>
                  <div className="mb-2 text-red-600">失败: {uploadProgress.failed} 个</div>
                  {uploadProgress.total > 0 && (
                    <Progress percent={Math.round(((uploadProgress.success + uploadProgress.failed) / uploadProgress.total) * 100)} status="active" />
                  )}
                </div>
              </div>
            ) : batchFiles.length > 0 ? (
              <div>
                <div className="mb-4 text-gray-600">已找到 {batchFiles.length} 个音频文件，请选择需要上传的文件：</div>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded">
                  {batchFiles.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 ${
                        selectedFiles.includes(index) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(index)}
                        onChange={() => toggleFileSelection(index)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" title={item.displayName}>
                          {item.displayName}
                        </div>
                      </div>
                      <Button
                        size="small"
                        type={playingFileIndex === index ? 'primary' : 'default'}
                        icon={playingFileIndex === index ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={() => togglePlayAudio(index)}
                      >
                        {playingFileIndex === index ? '暂停' : '试听'}
                      </Button>
                      <audio
                        ref={(el) => {
                          if (el) audioRefs.current[index] = el
                        }}
                        src={item.url}
                        onEnded={() => setPlayingFileIndex(null)}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="small" onClick={() => setSelectedFiles(batchFiles.map((_, i) => i))}>
                    全选
                  </Button>
                  <Button size="small" onClick={() => setSelectedFiles([])}>
                    取消全选
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">请选择包含音频文件的文件夹</div>
            )}
          </div>
        </Modal>

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