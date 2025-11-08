import React, { useState } from 'react'
import { UploadOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Upload, Modal, Input, message } from 'antd'
import { useNotification } from '../utils/NotificationContext'

// const { TextArea } = Typography
const { TextArea } = Input;


const TextDataSettings = ({ onUploadSuccess }) => {
  const { showError, showSuccess } = useNotification()
  const [jsonModalVisible, setJsonModalVisible] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [formattedJson, setFormattedJson] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleJsonSubmit = () => {
    try {
      const parsedJson = JSON.parse(jsonInput)
      const formatted = JSON.stringify(parsedJson, null, 2)
      setFormattedJson(formatted)
      showSuccess('JSON Parsed Successfully', 'The JSON has been validated and formatted.')
    } catch (error) {
      showError('Invalid JSON', 'Please enter valid JSON data.')
      return
    }
  }

  const uploadProps = {
    name: 'file',
    action: 'http://localhost:8081/api/upload', // Assuming this is the upload endpoint
    headers: {
      authorization: 'authorization-text'
    },
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList)
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`)
        if (onUploadSuccess) {
          onUploadSuccess() // Refresh the file list after upload
        }
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`)
        showError('Upload Failed', `Failed to upload ${info.file.name}`)
      }
    }
  }

  return (
    <div className="w-full bg-white/80 backdrop-blur-lg border-b border-slate-200 p-3 flex justify-end items-center space-x-3">
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>Upload File</Button>
      </Upload>
      <Button icon={<EditOutlined />} onClick={() => setJsonModalVisible(true)}>
        Manual Input
      </Button>

      <Modal
        title="Manual JSON Input"
        open={jsonModalVisible}
        onCancel={() => {
          setJsonModalVisible(false)
          setJsonInput('')
          setFormattedJson('')
        }}
        footer={null}
        width={700}
      >
        <div className="space-y-4">
          {
            <TextArea
              rows={8}
              placeholder="Paste your JSON data here..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '14px' }}
            />
          }
          <div className="flex justify-end">
            <Button type="primary" onClick={handleJsonSubmit} disabled={!jsonInput.trim()}>
              Format JSON
            </Button>
          </div>
          {formattedJson && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Formatted JSON:</h4>
              <TextArea rows={10} value={formattedJson} readOnly style={{ fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#f9fafb' }} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default TextDataSettings
