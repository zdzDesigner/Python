import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react'
import { Button, Modal, Form, Input, Upload, message, Popconfirm, Spin, Progress } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined, UserOutlined, PlayCircleOutlined, PauseCircleOutlined, UploadOutlined } from '@ant-design/icons'
import { fetchVoices, createVoice, updateVoice, deleteVoice } from '@/service/api/dubbing'
import { MultiUpload } from './MultiUpload'
import './style.css'

export const CSS_CARD = 'border border-gray-300 rounded-lg p-4 w-36 text-center shadow-sm bg-white relative transition-shadow duration-300 hover:shadow-md'

// Voice Card Component
const VoiceCard = memo(({ voice, onEdit, onDelete, audioPlayerRef, currentPlayingId, onPlay, selectionMode = false, isSelected = false, onSelect }) => {
  const [hovered, setHovered] = useState(false)

  // Check if this card is currently playing
  const isPlaying = currentPlayingId === voice.id

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

    if (isPlaying) {
      audioPlayerRef.current.pause()
      onPlay(null)
    } else {
      // Notify parent to update current playing ID
      onPlay(voice.id)

      // Update audio source and play
      audioPlayerRef.current.src = audioUrl
      audioPlayerRef.current.play()
    }
  }

  // Listen for audio end event
  useEffect(() => {
    const audio = audioPlayerRef.current
    if (!audio) return

    const handleEnded = () => {
      if (currentPlayingId === voice.id) {
        onPlay(null)
      }
    }

    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentPlayingId, voice.id, onPlay])

  return (
    <div
      className={`${CSS_CARD} ${hovered && 'card-hover'} ${selectionMode && isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Action buttons or selection checkbox */}
      {selectionMode ? (
        <div className="absolute left-0 w-full z-100 top-2 right-2 flex gap-1">
          <div className="flex-1" />
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect && onSelect(voice)}
            className="mr-[10px] w-5 h-5 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : (
        <div className={`absolute left-0 w-full z-100 top-2 right-2 flex gap-1 transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button className="ml-[10px]" type="primary" shape="circle" icon={<EditOutlined />} size="small" onClick={() => onEdit(voice)} />
          <div className="flex-1" />
          <Popconfirm title="删除音色" description="确定要删除这个音色吗？" onConfirm={() => onDelete(voice.id)} okText="确定" cancelText="取消">
            <Button className="mr-[10px]" type="primary" danger shape="circle" icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </div>
      )}

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
              className={`playing ${!isPlaying && 'opacity-0'}`}
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
})
VoiceCard.displayName = 'VoiceCard'

// Voice Form Modal Component
const VoiceFormModal = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [form] = Form.useForm()
  const [avatarFile, setAvatarFile] = useState(null)
  const [wavFile, setWavFile] = useState(null)
  const [previewAvatar, setPreviewAvatar] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isplaying, setIsPlaying] = useState(false)
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
    <Modal title={initialData ? '编辑音色' : '新增音色'} open={isOpen} onCancel={onClose} footer={null} width={400} transitionName="" maskTransitionName="" destroyOnClose>
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
              icon={isplaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => {
                if (!audioRef.current) {
                  audioRef.current = new Audio(audioUrl)
                  audioRef.current.onended = () => {
                    setIsPlaying(false)
                  }
                }

                if (isplaying) {
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
export const DubbingList = ({ selectionMode = false, onVoiceSelect, selectedVoices = [] }) => {
  const [voices, setVoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVoice, setEditingVoice] = useState(null)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [currentPlayingId, setCurrentPlayingId] = useState(null)
  const fileInputRef = useRef(null)
  const audioPlayerRef = useRef(null)

  // Initialize audio player once
  useEffect(() => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio()
    }

    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause()
        audioPlayerRef.current = null
      }
    }
  }, [])

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
    // Directly trigger file input instead of opening modal
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // Open modal only after files are selected
      setIsBatchModalOpen(true)
    }
  }

  const handleBatchUploadSuccess = () => {
    setIsBatchModalOpen(false)
    loadVoices()
  }

  const handlePlay = useCallback((voiceId) => {
    setCurrentPlayingId(voiceId)
  }, [])

  const handleSubmit = useCallback((formData, avatarFile, wavFile) => {
    if (editingVoice) {
      handleUpdateVoice(formData, avatarFile, wavFile)
    } else {
      handleCreateVoice(formData, avatarFile, wavFile)
    }
  }, [editingVoice])

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
    <div className="flex flex-col text-slate-800 cursor-default p-4">
      <div className="flex flex-wrap gap-4">
        {!selectionMode && (
          <div className={`flex flex-col border-dotted ${CSS_CARD}`}>
            <div className="flex-1" />
            <div className="flex flex-col gap-2 items-center justify-center">
              <div className="text-4xl text-center cursor-pointer text-gray-400 hover:text-blue-500 transition-colors" onClick={handleAddClick}>
                <PlusOutlined />
                <div className="text-xs">单独上传</div>
              </div>
              <div className="border-t border-gray-300 w-20 my-1"></div>
              <div className="text-4xl text-center cursor-pointer text-gray-400 hover:text-blue-500 transition-colors" onClick={handleBatchUpload}>
                <UploadOutlined />
                <div className="text-xs">批量上传</div>
              </div>
            </div>
            <div className="flex-1" />
          </div>
        )}
        {voices.map((voice) => {
          const isSelected = selectedVoices.some((v) => v.id === voice.id)
          return (
            <VoiceCard
              key={voice.id}
              voice={voice}
              onEdit={handleEditClick}
              onDelete={handleDeleteVoice}
              audioPlayerRef={audioPlayerRef}
              currentPlayingId={currentPlayingId}
              onPlay={handlePlay}
              selectionMode={selectionMode}
              isSelected={isSelected}
              onSelect={onVoiceSelect}
            />
          )
        })}
        <br />

        {voices.length === 0 && !loading && <div className="w-full text-center py-10 text-gray-600">暂无音色数据，请添加新的音色</div>}
      </div>

      {!selectionMode && (
        <>
          {/* Hidden file input for batch upload */}
          <input ref={fileInputRef} type="file" multiple accept="audio/*" style={{ display: 'none' }} onChange={handleFileSelect} />

          <MultiUpload isOpen={isBatchModalOpen} onClose={() => setIsBatchModalOpen(false)} onSuccess={handleBatchUploadSuccess} fileInputRef={fileInputRef} />

          <VoiceFormModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setEditingVoice(null)
            }}
            onSubmit={handleSubmit}
            initialData={editingVoice}
          />
        </>
      )}
    </div>
  )
}