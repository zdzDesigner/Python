import React, { useState, useEffect, useRef } from 'react'
import { Button, Modal, message, Progress, Spin } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons'
import { batchUploadVoices } from '@/service/api/dubbing'

export const MultiUpload = ({ isOpen, onClose, onSuccess, fileInputRef }) => {
  const [batchFiles, setBatchFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [batchUploading, setBatchUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ total: 0, success: 0, failed: 0 })
  const [playingFileIndex, setPlayingFileIndex] = useState(null)
  const audioRefs = useRef({})

  // Load files when modal opens
  useEffect(() => {
    if (isOpen && fileInputRef?.current?.files) {
      const files = fileInputRef.current.files

      const audioFiles = Array.from(files).filter((file) => {
        const ext = file.name.toLowerCase()
        return ext.endsWith('.wav') || ext.endsWith('.mp3') || ext.endsWith('.m4a') || ext.endsWith('.flac') || ext.endsWith('.ogg')
      })

      if (audioFiles.length === 0) {
        message.warning('未找到音频文件')
        onClose()
        return
      }

      const fileList = audioFiles.map((file, index) => ({
        file,
        displayName: getFileDisplayName(file),
        url: URL.createObjectURL(file),
        index
      }))

      setBatchFiles(fileList)
      setSelectedFiles(fileList.map((_, i) => i))
    }
  }, [isOpen])

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

  const handleFileSelect = (e) => {
    // This function is no longer needed as files are handled in parent component
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
      Object.keys(audioRefs.current).forEach((key) => {
        if (audioRefs.current[key]) {
          audioRefs.current[key].pause()
        }
      })

      audioElement.play()
      setPlayingFileIndex(index)
    }
  }

  const handleConfirmUpload = async () => {
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

      batchFiles.forEach((item) => URL.revokeObjectURL(item.url))

      setTimeout(() => {
        handleClose()
        if (onSuccess) onSuccess()
      }, 2000)
    } catch (err) {
      message.error('批量上传失败')
      console.error(err)
    } finally {
      setBatchUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClose = () => {
    if (!batchUploading) {
      setBatchFiles([])
      setSelectedFiles([])
      setUploadProgress({ total: 0, success: 0, failed: 0 })
      setPlayingFileIndex(null)
      // Reset file input in parent component
      if (fileInputRef?.current) {
        fileInputRef.current.value = ''
      }
      onClose()
    }
  }

  const triggerFileInput = () => {
    // Not needed anymore as file input is in parent
  }

  return (
    <>
      <Modal
        title="批量上传音频文件"
        open={isOpen}
        onCancel={handleClose}
        width={700}
        footer={
          batchUploading
            ? null
            : batchFiles.length > 0
            ? [
                <Button key="cancel" onClick={handleClose}>
                  取消
                </Button>,
                <Button key="upload" type="primary" onClick={handleConfirmUpload} disabled={selectedFiles.length === 0}>
                  上传 ({selectedFiles.length} 个文件)
                </Button>
              ]
            : [
                <Button key="close" onClick={handleClose}>
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
                    className={`flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 ${selectedFiles.includes(index) ? 'bg-blue-50' : ''}`}
                  >
                    <input type="checkbox" checked={selectedFiles.includes(index)} onChange={() => toggleFileSelection(index)} className="w-4 h-4" />
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
            <div className="text-center text-gray-500">
              <p>请点击"选择文件"按钮选择音频文件</p>
              <p className="text-xs mt-2">支持格式: WAV, MP3, M4A, FLAC, OGG</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
