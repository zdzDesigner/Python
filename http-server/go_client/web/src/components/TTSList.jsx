import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Card, Table, Tag, Typography, Select, Button, Space, Modal, Input, InputNumber, Popconfirm } from 'antd'

import { PlayCircleOutlined, ExperimentOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { MAP_TTS, mapTTSRecord, mapStatus, synthesizeTTS, checkTTSExists, ttsTplList, ttsTplBulkDelete, ttsTplUpdate } from '@/service/api/tts'
import { useNotification } from '@/utils/NotificationContext'
import BatchTrainingProgress from './BatchTrainingProgress'

const { Text } = Typography
const { Option } = Select

const TTSTable = memo(({ columns, tableData, tableHeight }) => {
  return (
    <Table
      // style={{ padding: 10, backgroundColor: '#fff', width: 'calc(100vw - 300px)' }}
      dataSource={tableData}
      columns={columns}
      size="small"
      key={(record, index) => record.id}
      pagination={false}
      // virtual={true}
      scroll={{ y: tableHeight, x: 1200 }}
      locale={{
        emptyText: tableData && tableData.length > 0 ? 'JSON数据有效但不包含TTS条目' : '尚未提供JSON数据'
      }}
    />
  )
})
TTSTable.displayName = 'TTSTable'

const MemoizedTableSelect = memo(({ recordKey, value, onChange, options }) => {
  return (
    <Select style={{ width: '100%' }} showSearch placeholder="请选择" value={value} onChange={(v) => onChange(recordKey, v)} virtual>
      {options}
    </Select>
  )
})
MemoizedTableSelect.displayName = 'MemoizedTableSelect'

const EditableCell = memo(({ record, dataIndex, value, onUpdate, type = 'text', options = null, min = null, max = null, recordKey }) => {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value)

  const recordKeyInternal = record.id
  // console.log({ recordKeyInternal, record })

  // Sync tempValue with value prop when value changes
  useEffect(() => {
    setTempValue(value)
    setEditing(false)
  }, [value])

  const handleChange = (newValue) => {
    setTempValue(newValue)
  }

  const handleSave = () => {
    // For InputNumber, the value is already a number or null
    if (type === 'number' && tempValue !== null && tempValue !== '') {
      if (min !== null && tempValue < min) return
      if (max !== null && tempValue > max) return
    }

    // console.log({ recordKeyInternal, dataIndex, tempValue, value })
    if (tempValue != value) onUpdate(recordKeyInternal, dataIndex, tempValue)
    setEditing(false)
  }

  const handleCancel = () => {
    setTempValue(value) // Reset to original value
    setEditing(false)
  }

  const handleCellClick = (e) => {
    // Prevent editing when clicking on input elements directly
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
      // Don't set to editing state if the record is locked
      if (!record.locked) {
        setEditing(true)
      } else {
        // Show notification if record is locked
        // This would need access to notification context, so we'll just not allow editing
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
      e.stopPropagation()
    } else if (e.key === 'Escape') {
      handleCancel()
      e.stopPropagation()
    }
  }

  // Check if the record is locked
  const isLocked = record.locked || false

  // Render the static content by default, and the input when editing
  if (!editing) {
    // Default display for different data types
    switch (dataIndex) {
      case 'speaker':
        return (
          <div
            onClick={isLocked ? undefined : handleCellClick}
            style={{
              cursor: isLocked ? 'default' : 'pointer',
              padding: '4px 8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              opacity: isLocked ? 0.6 : 1
            }}
          >
            <Text strong style={{ display: 'block' }}>
              {value || 'N/A'}
            </Text>
          </div>
        )
      case 'content':
        return (
          <div
            onClick={isLocked ? undefined : handleCellClick}
            style={{
              cursor: isLocked ? 'default' : 'pointer',
              padding: '4px 8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              opacity: isLocked ? 0.6 : 1
            }}
          >
            {value || 'N/A'}
          </div>
        )
      case 'tone':
        const toneColors = {
          neutral: 'default',
          happy: 'green',
          sad: 'blue',
          angry: 'red',
          excited: 'volcano',
          calm: 'geekblue'
        }
        const color = toneColors[value] || 'default'
        return (
          <div
            onClick={isLocked ? undefined : handleCellClick}
            style={{
              cursor: isLocked ? 'default' : 'pointer',
              padding: '4px 8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              opacity: isLocked ? 0.6 : 1
            }}
          >
            <Tag color={color}>{value || 'N/A'}</Tag>
          </div>
        )
      case 'intensity':
        return (
          <div
            onClick={isLocked ? undefined : handleCellClick}
            style={{
              cursor: isLocked ? 'default' : 'pointer',
              padding: '4px 8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              opacity: isLocked ? 0.6 : 1
            }}
          >
            <Tag color="orange">{value || 0}</Tag>
          </div>
        )
      case 'delay':
      case 'truncate':
        return (
          <div
            onClick={isLocked ? undefined : handleCellClick}
            style={{
              cursor: isLocked ? 'default' : 'pointer',
              padding: '4px 8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              opacity: isLocked ? 0.6 : 1
            }}
          >
            {`${value || 0}ms`}
          </div>
        )
      default:
        return (
          <div
            onClick={isLocked ? undefined : handleCellClick}
            style={{
              cursor: isLocked ? 'default' : 'pointer',
              padding: '4px 8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              opacity: isLocked ? 0.6 : 1
            }}
          >
            {value || 'N/A'}
          </div>
        )
    }
  }

  // Only render the input if not locked
  if (isLocked) {
    // If record is locked but we're in editing state, cancel editing
    if (editing) {
      setEditing(false)
    }

    // Return the display view
    switch (dataIndex) {
      case 'speaker':
        return (
          <div
            style={{
              cursor: 'default',
              padding: '4px 8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              opacity: 0.6
            }}
          >
            <Text strong style={{ display: 'block' }}>
              {value || 'N/A'}
            </Text>
          </div>
        )
      case 'content':
        return (
          <div
            style={{
              cursor: 'default',
              padding: '4px 8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              opacity: 0.6
            }}
          >
            {value || 'N/A'}
          </div>
        )
      case 'tone':
        const toneColors = {
          neutral: 'default',
          happy: 'green',
          sad: 'blue',
          angry: 'red',
          excited: 'volcano',
          calm: 'geekblue'
        }
        const color = toneColors[value] || 'default'
        return (
          <div
            style={{
              cursor: 'default',
              padding: '4px 8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              opacity: 0.6
            }}
          >
            <Tag color={color}>{value || 'N/A'}</Tag>
          </div>
        )
      case 'intensity':
        return (
          <div
            style={{
              cursor: 'default',
              padding: '4px 8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              opacity: 0.6
            }}
          >
            <Tag color="orange">{value || 0}</Tag>
          </div>
        )
      case 'delay':
      case 'truncate':
        return (
          <div
            style={{
              cursor: 'default',
              padding: '4px 8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              opacity: 0.6
            }}
          >
            {`${value || 0}ms`}
          </div>
        )
      default:
        return (
          <div
            style={{
              cursor: 'default',
              padding: '4px 8px',
              border: '1px solid transparent',
              borderRadius: '2px',
              opacity: 0.6
            }}
          >
            {value || 'N/A'}
          </div>
        )
    }
  }

  switch (type) {
    case 'select':
      return (
        <Select style={{ width: '100%' }} value={tempValue} onChange={handleChange} onPressEnter={handleSave} onBlur={handleSave} virtual autoFocus>
          {options}
        </Select>
      )
    case 'number':
      return (
        <InputNumber
          style={{ width: '100%' }}
          value={tempValue}
          onChange={handleChange}
          min={min}
          max={max}
          precision={2}
          onPressEnter={handleSave}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      )
    case 'text':
    default:
      return (
        <Input
          value={tempValue}
          onChange={(e) => handleChange(e.target.value)}
          onPressEnter={handleSave}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      )
  }
})

const TTSList = ({ jsonData, audioFiles, onSynthesizeComplete }) => {
  // State to store the table height
  const [tableHeight, setTableHeight] = useState('calc(100vh - 200px)')
  // State to track currently training records
  const [trainingRecords, setTrainingRecords] = useState({})
  const [playingRecords, setPlayingRecords] = useState({})

  // State to track the output paths for trained records
  const [trainedRecords, setTrainedRecords] = useState({})
  // State for character mapping modal
  const [isMappingModalVisible, setIsMappingModalVisible] = useState(false)
  // State for character mappings
  const [characterMappings, setCharacterMappings] = useState({})
  // State for table data
  const [tableData, setTableData] = useState([])
  // State for batch training progress
  const [isBatchTraining, setIsBatchTraining] = useState(false)
  const [batchProgress, setBatchProgress] = useState(0)
  const [batchProgressText, setBatchProgressText] = useState('')
  const [batchAbortController, setBatchAbortController] = useState(null)

  const { showError, showSuccess, showWarning } = useNotification()

  // Update tableData when jsonData changes, and fetch TTS records from API when jsonData is null/undefined
  useEffect(() => {
    const fetchTTSRecords = async () => {
      try {
        // Fetch TTS records from the API
        const response = await ttsTplList({ book_id: 0, section_id: 0, page: 1, page_size: 100 }) // Get first 100 records
        if (response.list && Array.isArray(response.list)) {
          console.log(response.list)
          // Transform API response to match expected format
          const transformedData = response.list.map(mapTTSRecord)
          setTableData(transformedData)
        } else {
          setTableData([])
        }
      } catch (error) {
        console.error('Error fetching TTS records:', error)
        // If there's an error, set empty data
        setTableData([])
      }
    }

    if (jsonData) {
      // Use provided JSON data
      // const initialData = jsonData.map((item) => ({
      //   ...item,
      //   dubbing: item.dubbing
      // }))
      setTableData(jsonData.map(mapTTSRecord))
      // fetchTTSRecords()
    } else {
      fetchTTSRecords()
    }
  }, [jsonData])

  // Extract unique character names using useMemo to prevent unnecessary recalculations
  const uniqueCharacterNames = useMemo(() => {
    if (!tableData) return []
    const uniqueNames = [...new Set(tableData.map((item) => item.speaker))]
    return uniqueNames
  }, [tableData])

  // console.log({jsonData})

  // Update table height when window is resized
  useEffect(() => {
    const updateTableHeight = () => {
      const newHeight = window.innerHeight - 200 // Adjust this value as needed
      setTableHeight(newHeight > 0 ? newHeight : 100) // Ensure minimum height
    }

    // Set initial height
    updateTableHeight()

    // Add resize event listener
    window.addEventListener('resize', updateTableHeight)

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', updateTableHeight)
    }
  }, [])

  const handleTrain = useCallback(
    async (record) => {
      // Mark this record as currently training
      setTrainingRecords((prev) => ({ ...prev, [record.id]: true }))

      try {
        console.log('Training with record:', record)

        // Call synthesizeTTS with the record data
        const result = await synthesizeTTS(record)

        // If result contains an output path, save it to the trained records
        if (result.outpath) {
          // Save the output path for this record
          setTrainedRecords((prev) => ({
            ...prev,
            [record.id]: result.outpath
          }))
          record.output_wav_path = result.outpath

          showSuccess('训练成功', '音频文件已生成')
        }
      } catch (error) {
        console.error('Error during training:', error)
        showError('训练失败', error.message)
      } finally {
        // Remove the training state for this record
        setTrainingRecords((prev) => {
          const newRecords = { ...prev }
          delete newRecords[record.id]
          return newRecords
        })
      }
    },
    [showError, showSuccess]
  )

  // Function to play audio with end truncation
  const playAudio = useCallback(
    (path, record) => {
      console.log('xxxxx')
      if (!!playingRecords[record.id + 'audio']) {
        playingRecords[record.id + 'audio'].pause()
        cleanup()
      }

      const truncateMs = record.truncate || 0
      const audioUrl = `http://localhost:8081/api/audio-file/output${path.startsWith('/') ? path : '/' + path}`
      console.log({ audioUrl })
      const audio = new Audio(audioUrl)
      setPlayingRecords((prev) => ({ ...prev, [record.id]: true, [record.id + 'audio']: audio }))

      // Start playing the audio
      const playPromise = audio.play()

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Error playing audio:', error)
          showError('播放失败', error.message)
          // setTrainingRecords((prev) => {
          //   const newRecords = { ...prev }
          //   delete newRecords[record.id]
          //   delete newRecords[record.id + audio]
          //   return newRecords
          // })
          cleanup()
        })

        // Use timeupdate event to monitor playback time
        const handleTimeUpdate = () => {
          if (audio.duration && truncateMs > 0) {
            const timeRemaining = (audio.duration - audio.currentTime) * 1000 // in milliseconds
            if (timeRemaining <= truncateMs) {
              audio.pause()
              cleanup()
            }
          }
        }
        audio.addEventListener('timeupdate', handleTimeUpdate)

        // Clean up event listener when audio ends or is paused
        const cleanup = () => {
          setPlayingRecords((prev) => {
            const newRecords = { ...prev }
            delete newRecords[record.id]
            delete newRecords[record.id + audio]
            return newRecords
          })
          audio.removeEventListener('timeupdate', handleTimeUpdate)
        }
        // Add timeupdate event listener to check timing
        audio.addEventListener('ended', cleanup)
        audio.addEventListener('pause', cleanup)
      }
    },
    [showError]
  )

  const handlePlay = useCallback(
    async (record) => {
      let outpath = trainedRecords[record.id]

      if (outpath) {
        playAudio(outpath, record)
      } else {
        try {
          const response = await checkTTSExists(record)
          if (response.exists) {
            outpath = response.outpath
            setTrainedRecords((prev) => ({
              ...prev,
              [record.id]: outpath
            }))
            playAudio(outpath, record)
          } else {
            showError('播放失败', '音频文件未生成，请先训练此条数据')
          }
        } catch (error) {
          console.error('Error checking TTS existence:', error)
          showError('播放失败', '检查音频文件时出错')
        }
      }
    },
    [showError, trainedRecords, checkTTSExists, playAudio]
  )

  // Memoize table audio files options to prevent re-renders
  const tableAudioFileOptions = useMemo(() => {
    if (!audioFiles) return []
    return audioFiles.map((file) => (
      <Option key={file.path} value={file.path}>
        {file.name}
      </Option>
    ))
  }, [audioFiles])

  // Function to update table data for a specific record
  const updateTableDataDubbing = useCallback((recordKey, newDubbingValue) => {
    setTableData((prevData) => {
      const newData = [...prevData]
      const index = newData.findIndex((item) => item.id === recordKey)
      if (index !== -1) {
        newData[index] = { ...newData[index], dubbing: newDubbingValue }
      }
      return newData
    })
  }, [])

  // Function to toggle lock state for a specific record
  const toggleLock = useCallback(
    async (recordId) => {
      setTableData((prevData) => {
        const newData = [...prevData]
        const index = newData.findIndex((item) => item.id === recordId)
        if (index !== -1) {
          const record = newData[index]
          const updatedRecord = { ...record, locked: !record.locked }

          // Update the record in the state
          newData[index] = updatedRecord

          // Update the backend as well
          ttsTplUpdate(record.id, { status: mapStatus(updatedRecord.locked) }).catch((error) => {
            console.error('Failed to update record lock state on backend:', error)
            showWarning('更新失败', `无法同步更新到服务器: ${error.message}`)
            // Revert the change in UI if update failed
            setTableData((prev) => {
              const revertedData = [...prev]
              const revertIndex = revertedData.findIndex((item) => item.id === recordId)
              if (revertIndex !== -1) {
                revertedData[revertIndex] = record // Revert to original record
              }
              return revertedData
            })
          })

          return newData
        }
        return prevData
      })
    },
    [showWarning]
  )

  // Function to update table data for a specific record field and sync with backend
  const updateTableData = useCallback(
    async (recordKey, field, newValue) => {
      setTableData((prevData) => {
        const newData = [...prevData]
        const index = newData.findIndex((item) => item.id === recordKey)
        if (index !== -1) {
          const record = newData[index]
          // Skip update if record is locked and field is editable
          if (record.locked && ['content', 'tone', 'intensity', 'delay', 'truncate', 'speaker'].includes(field)) {
            showWarning('记录已锁定', '无法编辑已锁定的记录')
            return prevData
          }

          const updatedRecord = { ...record, [field]: newValue }

          // Update the record in the state
          newData[index] = updatedRecord

          // Define the fields to sync with backend
          const fieldsToSync = ['content', 'tone', 'intensity', 'delay', 'truncate']

          // If the field is one of the ones that need backend sync, call the API
          if (fieldsToSync.includes(field) && record.id) {
            try {
              // Map field names to match backend expectations
              const updatePayload = {}
              switch (field) {
                case 'content':
                case 'tone':
                  updatePayload[MAP_TTS[field]] = newValue
                  break
                case 'intensity':
                case 'delay':
                case 'truncate':
                  updatePayload[MAP_TTS[field]] = Number(newValue)
                  break
                default:
                  updatePayload[field] = newValue
              }

              // Call the backend API to update the record
              ttsTplUpdate(record.id, updatePayload).catch((error) => {
                console.error('Failed to update record on backend:', error)
                showWarning('更新失败', `无法同步更新到服务器: ${error.message}`)
                // Revert the change in UI if update failed
                setTableData((prev) => {
                  const revertedData = [...prev]
                  const revertIndex = revertedData.findIndex((item) => item.id === recordKey)
                  if (revertIndex !== -1) {
                    revertedData[revertIndex] = record // Revert to original record
                  }
                  return revertedData
                })
              })
            } catch (error) {
              console.error('Error preparing update request:', error)
            }
          }

          return newData
        }
        return prevData
      })
    },
    [showWarning]
  )

  const columns = useMemo(
    () => [
      // {
      //   title: '序号',
      //   dataIndex: 'index',
      //   key: 'index',
      //   render: (text, record, index) => index + 1,
      //   width: 60
      // },
      {
        title: '角色',
        width: 120,
        dataIndex: 'speaker',
        key: 'speaker',
        fixed: 'left',
        render: (text, record) => {
          return <EditableCell record={record} dataIndex="speaker" title="角色" value={text} onUpdate={updateTableData} type="text" recordKey={record.id} />
        }
      },
      {
        title: '配音',
        width: 150,
        dataIndex: 'dubbing',
        key: 'dubbing',
        fixed: 'left',
        render: (text, record) => {
          return <MemoizedTableSelect recordKey={record.id} value={text} onChange={updateTableDataDubbing} options={tableAudioFileOptions} />
        }
      },
      {
        title: '文本内容',
        dataIndex: 'content',
        key: 'content',
        render: (text, record) => {
          return <EditableCell record={record} dataIndex="content" title="文本内容" value={text} onUpdate={updateTableData} type="text" recordKey={record.id} />
        }
      },
      {
        title: '情感',
        width: 160,
        dataIndex: 'tone',
        key: 'tone',
        render: (text, record) => {
          return <EditableCell record={record} dataIndex="tone" title="情感" value={text} onUpdate={updateTableData} type="text" recordKey={record.id} />
        }
      },
      {
        title: '情感比重',
        dataIndex: 'intensity',
        key: 'intensity',
        width: 80,
        render: (val, record) => {
          return (
            <EditableCell
              record={record}
              dataIndex="intensity"
              title="情感比重"
              value={val}
              onUpdate={updateTableData}
              type="number"
              min={0}
              max={10}
              recordKey={record.id}
            />
          )
        }
      },
      {
        title: '延迟',
        dataIndex: 'delay',
        key: 'delay',
        width: 100,
        render: (val, record) => {
          return (
            <EditableCell
              record={record}
              dataIndex="delay"
              title="延迟"
              value={val}
              onUpdate={updateTableData}
              type="number"
              min={0}
              max={5000}
              recordKey={record.id}
            />
          )
        }
      },
      {
        title: '末尾截取',
        dataIndex: 'truncate',
        key: 'truncate',
        width: 100,
        render: (val, record) => {
          return (
            <EditableCell
              record={record}
              dataIndex="truncate"
              title="截取"
              value={val}
              onUpdate={updateTableData}
              type="number"
              min={0}
              max={5000}
              recordKey={record.id}
            />
          )
        }
      },
      {
        title: '操作',
        key: 'action',
        width: 200,
        fixed: 'right',
        render: (text, record) => {
          const isTraining = trainingRecords[record.id]
          const isPlaying = playingRecords[record.id]
          const isexist = record.output_wav_path != ''
          const isLocked = record.locked || false
          // console.log({ isexist }, record)

          return (
            <Space size="middle">
              <Button
                icon={<ExperimentOutlined />}
                onClick={() => handleTrain(record)}
                title="训练此条数据"
                loading={isTraining}
                disabled={isTraining || isLocked}
              />
              <Button
                icon={<PlayCircleOutlined />}
                onClick={() => handlePlay(record)}
                disabled={isTraining || !isexist}
                loading={isPlaying}
                title="播放训练后的音频"
              />
              <Button
                icon={isLocked ? <LockOutlined /> : <UnlockOutlined />}
                onClick={() => toggleLock(record.id)}
                title={isLocked ? '解锁此条数据' : '锁定此条数据'}
                type={isLocked ? 'default' : 'default'}
                style={{ color: isLocked ? '#52c41a' : '#ff4d4f' }}
              ></Button>
            </Space>
          )
        }
      }
    ],
    [handlePlay, handleTrain, tableAudioFileOptions, trainingRecords, playingRecords, updateTableDataDubbing, updateTableData]
  )

  // Memoize the audio files options to prevent unnecessary re-renders
  const audioFileOptions = useMemo(() => {
    if (!audioFiles) return []
    return audioFiles.map((file) => (
      <Option key={file.path} value={file.path}>
        {file.name}
      </Option>
    ))
  }, [audioFiles])

  // Function to handle character mapping changes
  const handleMappingChange = useCallback((characterName, audioPath) => {
    setCharacterMappings((prev) => ({
      ...prev,
      [characterName]: audioPath
    }))
  }, [])

  // 批量设置音色
  const handleModalOk = useCallback(() => {
    // Apply the mappings to the table data
    setTableData((prevData) => {
      return prevData.map((item) => {
        if (characterMappings[item.speaker]) {
          return { ...item, dubbing: characterMappings[item.speaker] }
        }
        return item
      })
    })
    setIsMappingModalVisible(false)
  }, [characterMappings])

  // Function to handle modal cancellation
  const handleModalCancel = useCallback(() => {
    setIsMappingModalVisible(false)
    // Reset character mappings when modal is closed
    setCharacterMappings({})
  }, [])

  // Function to open the mapping modal
  const openMappingModal = useCallback(() => {
    // Initialize character mappings with current values
    const initialMappings = {}
    if (tableData) {
      tableData.forEach((item) => {
        if (item.dubbing && item.dubbing !== '') {
          initialMappings[item.speaker] = item.dubbing
        }
      })
    }
    setCharacterMappings(initialMappings)
    setIsMappingModalVisible(true)
  }, [tableData])

  {
    // <Card className="w-full mt-4">
    // </Card>
  }

  // 批量训练
  const handleBatchTrain = async () => {
    if (!tableData || tableData.length === 0) {
      showWarning('警告', '没有数据可训练')
      return
    }

    setIsBatchTraining(true)
    setBatchProgress(0)
    setBatchProgressText('准备开始批量训练...')

    // Create an AbortController for cancellation
    const abortController = new AbortController()
    setBatchAbortController(abortController)

    // 设置训练状态
    const allRecordKeys = tableData.map((item) => item.id)
    setTrainingRecords((prev) => {
      const newRecords = { ...prev }
      allRecordKeys.forEach((key) => (newRecords[key] = true))
      return newRecords
    })

    let successCount = 0
    let errorCount = 0

    // Train each record sequentially
    for (let i = 0; i < tableData.length; i++) {
      // Check if cancellation was requested
      if (abortController.signal.aborted) {
        setBatchProgressText('训练已被取消')
        break
      }

      const record = tableData[i]

      try {
        setBatchProgressText(`正在训练: ${record.speaker} - ${record.content.substring(0, 20)}${record.content.length > 20 ? '...' : ''}`)
        console.log('Batch training with record:', record)
        const result = await synthesizeTTS(record, { signal: abortController.signal })

        if (result.outpath) {
          setTrainedRecords((prev) => ({
            ...prev,
            [record.id]: result.outpath
          }))
          record.output_wav_path = result.outpath
          successCount++
        } else {
          successCount++
        }
      } catch (error) {
        console.error('Error during batch training:', error)
        if (abortController.signal.aborted) {
          setBatchProgressText('训练已被取消')
          break
        }
        errorCount++
        showError('训练失败', `训练失败: ${record.speaker} - ${error.message}`)
      } finally {
        // Remove the training state for this record
        setTrainingRecords((prev) => {
          const newRecords = { ...prev }
          delete newRecords[record.id]
          return newRecords
        })

        // Update progress percentage
        const progress = ((i + 1) / tableData.length) * 100
        setBatchProgress(progress)
      }

      // Check again after processing to see if cancellation was requested
      if (abortController.signal.aborted) {
        setBatchProgressText('训练已被取消')
        break
      }
    }

    // Clean up - ensure all training records are cleared
    setIsBatchTraining(false)
    setBatchProgress(0)
    setBatchProgressText('')
    setBatchAbortController(null)

    // Clear all training states to ensure UI consistency after cancellation
    if (abortController.signal.aborted) {
      setTrainingRecords({})
    }

    if (!abortController.signal.aborted) {
      // Show final summary
      showSuccess('批量训练完成', `总处理: ${tableData.length} 条记录 (${successCount} 成功, ${errorCount} 失败)`)
    }
  }

  // 批量删除
  const handleBulkDelete = async () => {
    try {
      // Try to extract book_id and section_id from the first record in tableData
      let bookId = 0
      let sectionId = 0

      if (tableData && tableData.length > 0) {
        const firstRecord = tableData[0]
        bookId = firstRecord.book_id || firstRecord.BookId || 0
        sectionId = firstRecord.section_id || firstRecord.SectionId || 0
      }

      if (bookId === undefined || sectionId === undefined) {
        showWarning('警告', '无法确定要删除的数据范围，请确保数据包含 book_id 或 section_id')
        return
      }

      const response = await ttsTplBulkDelete(bookId, sectionId)

      showSuccess('批量删除成功', `已删除当前章节的所有数据`)

      // Refresh the table data after deletion
      if (!jsonData) {
        const refreshResponse = await ttsTplList({ book_id: bookId, section_id: sectionId, page: 1, page_size: 100 })
        if (refreshResponse.list && Array.isArray(refreshResponse.list)) {
          const transformedData = refreshResponse.list.map((record) => ({
            ...record, // Include all other fields from the record
            speaker: record.role || record.speaker || '',
            content: record.text || record.content || '',
            tone: record.emotion_text || record.tone || '',
            intensity: record.emotion_alpha || record.intensity || 0,
            delay: record.interval_silence || record.delay || 0,
            dubbing: record.speaker_audio_path || undefined
          }))
          setTableData(transformedData)
        } else {
          setTableData([])
        }
      } else {
        // If jsonData is provided, set table to empty
        setTableData([])
      }
    } catch (error) {
      console.error('Error during bulk delete:', error)
      showError('批量删除失败', error.message)
    }
  }

  return (
    <>
      <div style={{ padding: 10 }}>
        {
          // <Button type="primary" onClick={() => setIsMappingModalVisible(true)}>
        }
        <Button type="primary" onClick={openMappingModal} disabled={isBatchTraining}>
          角色配音
        </Button>
        <Button type="primary" style={{ marginLeft: 10 }} onClick={handleBatchTrain} loading={isBatchTraining} disabled={isBatchTraining}>
          批量训练
        </Button>
        <Popconfirm
          title="确认删除"
          description="您确定要删除当前章节的所有数据吗？此操作不可撤销。"
          onConfirm={handleBulkDelete}
          okText="确认"
          cancelText="取消"
        >
          <Button type="primary" danger style={{ marginLeft: 10 }} disabled={isBatchTraining}>
            批量删除
          </Button>
        </Popconfirm>
        <BatchTrainingProgress
          isVisible={isBatchTraining}
          progress={batchProgress}
          progressText={batchProgressText}
          onCancelTraining={() => {
            if (batchAbortController) {
              batchAbortController.abort()
            }
          }}
        />
      </div>
      {
        <Modal title="角色配音" open={isMappingModalVisible} onOk={handleModalOk} onCancel={handleModalCancel} width={600}>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {uniqueCharacterNames.map((characterName, index) => (
              <div key={characterName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <strong>{characterName}</strong>
                </div>
                <div style={{ flex: 2, marginLeft: '20px' }}>
                  <Select
                    showSearch
                    style={{ width: '100%' }}
                    placeholder="选择音频文件"
                    value={characterMappings[characterName] || undefined}
                    onChange={(value) => handleMappingChange(characterName, value)}
                    allowClear
                    virtual
                  >
                    {audioFileOptions}
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      }
      {<TTSTable columns={columns} tableData={tableData} tableHeight={tableHeight} />}
    </>
  )
}

export default memo(TTSList)
