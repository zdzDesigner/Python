import React, { useState, memo } from 'react'
import { UploadOutlined, EditOutlined } from '@ant-design/icons'
import { Space, Button, Upload, Modal, Input, message } from 'antd'
import { useNotification } from '../utils/NotificationContext'
import { ttsTplSave, ttsTplList } from '../service/api/tts'

// const { TextArea } = Typography
const { TextArea } = Input

const TextDataSettings = ({ onJsonData }) => {
  const { showError, showSuccess } = useNotification()
  // const [jsonModalVisible, setJsonModalVisible] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [formattedJson, setFormattedJson] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJsonSubmit = async () => {
    try {
      const parsedJson = JSON.parse(jsonInput)
      const formatted = JSON.stringify(parsedJson, null, 2)
      setFormattedJson(formatted)

      // Show loading state
      setLoading(true)

      // Save the TTS template data to the database
      const result = await ttsTplSave(parsedJson)
      showSuccess('JSON Saved Successfully', `Stored ${result.count || parsedJson.length} TTS records`)

      if (onJsonData) {
        const { list } = await ttsTplList()
        onJsonData(list) // Pass the JSON input to parent component
      }
      // setJsonModalVisible(false) // Close the modal after successful submission
    } catch (error) {
      // console.error('Error saving TTS template:', error)
      showError('Save Failed', error.message || 'Please enter valid JSON data.')
      setFormattedJson(error.message)
    } finally {
      setLoading(false)
    }
  }

  const uploadProps = {
    name: 'file',
    // Remove action to prevent actual upload to server
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList)
      }
      // Since we're not uploading, status will not be 'done'
      // But the content will be processed in beforeUpload
    },
    // Process file before upload to handle different formats
    beforeUpload(file) {
      const reader = new FileReader()

      reader.onload = (e) => {
        const content = e.target.result
        // Set the content to the input field for review
        setJsonInput(content)
      }

      // Handle different file types
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        reader.readAsText(file)
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        reader.readAsText(file)
      } else if (file.name.endsWith('.csv')) {
        reader.readAsText(file)
      } else {
        // For other file types, try to read as text
        reader.readAsText(file)
      }

      // Return false to prevent actual upload to server
      return false
    }
  }

  return (
    <div className="space-y-4">
      <Space>
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>Upload File</Button>
        </Upload>
        {
          // <Button icon={<EditOutlined />} onClick={() => setJsonModalVisible(true)}>
          //   Manual Input
          // </Button>
        }
      </Space>
      {
        <TextArea
          rows={8}
          placeholder="Paste your JSON data here..."
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          style={{ fontFamily: 'monospace', fontSize: '14px' }}
        />
      }
      <div className="flex justify-end py-4">
        <Button type="primary" onClick={handleJsonSubmit} disabled={!jsonInput.trim() || loading} loading={loading}>
          确定
        </Button>
      </div>
      {formattedJson && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Formatted JSON Error:</h4>
          <TextArea rows={10} value={formattedJson} readOnly style={{ fontFamily: 'monospace', fontSize: '14px', backgroundColor: '#f9fafb' }} />
        </div>
      )}
    </div>
  )
}

export default memo(TextDataSettings)
