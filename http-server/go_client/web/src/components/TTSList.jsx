import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Card, Table, Tag, Typography, Select, Button, Space, Modal } from 'antd'

import { PlayCircleOutlined, ExperimentOutlined } from '@ant-design/icons'
import { audio_text } from '@/assets/audio_text'
import { synthesizeTTS, checkTTSExists } from '@/service/api/tts'
import { useNotification } from '@/utils/NotificationContext'

const { Text } = Typography
const { Option } = Select

const TTSTable = memo(({ columns, tableData, tableHeight }) => {
  return (
    <Table
      style={{ padding: 10, backgroundColor: '#fff', width: 'calc(100vw - 300px)' }}
      dataSource={tableData}
      columns={columns}
      size="small"
      rowKey={(record, index) => `${record.speaker}-${record.content}-${index}`}
      pagination={false}
      virtual={true}
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
    <Select style={{ width: '100%' }} value={value} onChange={(newValue) => onChange(recordKey, newValue)} virtual>
      {options}
    </Select>
  )
})
MemoizedTableSelect.displayName = 'MemoizedTableSelect'

const TTSList = ({ jsonData, audioFiles, onSynthesizeComplete }) => {
  // State to store the table height
  const [tableHeight, setTableHeight] = useState('calc(100vh - 200px)')
  // State to track currently training records
  const [trainingRecords, setTrainingRecords] = useState({})
  // State to track the output paths for trained records
  const [trainedRecords, setTrainedRecords] = useState({})
  // State for character mapping modal
  const [isMappingModalVisible, setIsMappingModalVisible] = useState(false)
  // State for character mappings
  const [characterMappings, setCharacterMappings] = useState({})
  // State for table data
  const [tableData, setTableData] = useState([])

  const { showError, showSuccess, showWarning } = useNotification()

  // Update tableData when jsonData changes
  useEffect(() => {
    const initialData = jsonData
      ? jsonData.map((item) => ({
          ...item,
          dubbing: item.dubbing || '请选择'
        }))
      : audio_text.map((item) => ({ ...item, dubbing: '请选择' }))
    setTableData(initialData)
  }, [jsonData])

  // Extract unique character names using useMemo to prevent unnecessary recalculations
  const uniqueCharacterNames = useMemo(() => {
    if (!tableData) return []
    const uniqueNames = [...new Set(tableData.map((item) => item.speaker))]
    return uniqueNames
  }, [tableData])

  // console.log({jsonData})

  const renderToneTag = (tone) => {
    const toneColors = {
      neutral: 'default',
      happy: 'green',
      sad: 'blue',
      angry: 'red',
      excited: 'volcano',
      calm: 'geekblue'
    }

    const color = toneColors[tone] || 'default'
    return <Tag color={color}>{tone || 'N/A'}</Tag>
  }

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
      // Generate a unique key for the record (same as used in batch training)
      const recordKey = `${record.speaker}-${record.content}`

      // Mark this record as currently training
      setTrainingRecords((prev) => ({ ...prev, [recordKey]: true }))

      try {
        console.log('Training with record:', record)

        // Call synthesizeTTS with the record data
        const result = await synthesizeTTS(record)

        // If result contains an output path, save it to the trained records
        if (result.newFile && result.newFile.path) {
          // Save the output path for this record
          setTrainedRecords((prev) => ({
            ...prev,
            [recordKey]: result.newFile.name
          }))

          showSuccess('训练成功', '音频文件已生成')
        } else if (result.outpath) {
          // If result has outpath directly
          setTrainedRecords((prev) => ({
            ...prev,
            [recordKey]: result.outpath
          }))

          showSuccess('训练成功', '音频文件已生成')
        } else {
          showSuccess('训练成功', '音频文件已 generated')
        }
      } catch (error) {
        console.error('Error during training:', error)
        showError('训练失败', error.message)
      } finally {
        // Remove the training state for this record
        setTrainingRecords((prev) => {
          const newRecords = { ...prev }
          delete newRecords[recordKey]
          return newRecords
        })
      }
    },
    [showError, showSuccess]
  )

  const handlePlay = useCallback(
    async (record) => {
      const recordKey = `${record.speaker}-${record.content}`
      let outpath = trainedRecords[recordKey]

      const playAudio = (path) => {
        const audioUrl = `http://localhost:8081/api/audio-file${path.startsWith('/') ? path : '/' + path}`
        const audio = new Audio(audioUrl)
        audio.play().catch((error) => {
          console.error('Error playing audio:', error)
          showError('播放失败', error.message)
        })
      }

      if (outpath) {
        playAudio(outpath)
      } else {
        try {
          const response = await checkTTSExists(record)
          if (response.exists) {
            outpath = response.outpath
            setTrainedRecords((prev) => ({
              ...prev,
              [recordKey]: outpath
            }))
            playAudio(outpath)
          } else {
            showError('播放失败', '音频文件未生成，请先训练此条数据')
          }
        } catch (error) {
          console.error('Error checking TTS existence:', error)
          showError('播放失败', '检查音频文件时出错')
        }
      }
    },
    [showError, trainedRecords, checkTTSExists]
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
      const index = newData.findIndex((item) => `${item.speaker}-${item.content}` === recordKey)
      if (index !== -1) {
        newData[index] = { ...newData[index], dubbing: newDubbingValue }
      }
      return newData
    })
  }, [])

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
        render: (speaker) => <Text strong>{speaker || 'N/A'}</Text>
      },
      {
        title: '配音',
        width: 150,
        dataIndex: 'dubbing',
        key: 'dubbing',
        fixed: 'left',
        render: (text, record) => {
          const recordKey = `${record.speaker}-${record.content}`
          return <MemoizedTableSelect recordKey={recordKey} value={text} onChange={updateTableDataDubbing} options={tableAudioFileOptions} />
        }
      },
      {
        title: '文本内容',
        dataIndex: 'content',
        key: 'content',
        render: (content) => content || 'N/A'
      },
      {
        title: '情感',
        width: 160,
        dataIndex: 'tone',
        key: 'tone',
        render: renderToneTag
      },
      {
        title: '情感比重',
        dataIndex: 'intensity',
        key: 'intensity',
        width: 80,
        render: (intensity) => <Tag color="orange">{intensity || 0}</Tag>
      },
      {
        title: '延迟',
        dataIndex: 'delay',
        key: 'delay',
        width: 100,
        render: (delay) => `${delay || 0}ms`
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        fixed: 'right',
        render: (text, record) => {
          const recordKey = `${record.speaker}-${record.content}`
          const isTraining = trainingRecords[recordKey]

          return (
            <Space size="middle">
              <Button icon={<ExperimentOutlined />} onClick={() => handleTrain(record)} title="训练此条数据" loading={isTraining} disabled={isTraining} />
              <Button icon={<PlayCircleOutlined />} onClick={() => handlePlay(record)} disabled={isTraining} title="播放训练后的音频" />
            </Space>
          )
        }
      }
    ],
    [handlePlay, handleTrain, tableAudioFileOptions, trainingRecords, updateTableDataDubbing]
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

  // Function to handle modal confirmation
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
        if (item.dubbing && item.dubbing !== '请选择') {
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

  // Function for batch training all records
  const handleBatchTrain = async () => {
    if (!tableData || tableData.length === 0) {
      showWarning('警告', '没有数据可训练')
      return
    }

    // Mark all records as training
    const allRecordKeys = tableData.map((item) => `${item.speaker}-${item.content}`)
    setTrainingRecords((prev) => {
      const newRecords = { ...prev }
      allRecordKeys.forEach((key) => {
        newRecords[key] = true
      })
      return newRecords
    })

    let successCount = 0
    let errorCount = 0

    // Train each record sequentially
    for (let i = 0; i < tableData.length; i++) {
      const record = tableData[i]
      const recordKey = `${record.speaker}-${record.content}`

      try {
        console.log('Batch training with record:', record)
        const result = await synthesizeTTS(record)

        // If result contains an output path, save it to the trained records
        if (result.newFile && result.newFile.path) {
          setTrainedRecords((prev) => ({
            ...prev,
            [recordKey]: result.newFile.name
          }))
          successCount++
        } else if (result.outpath) {
          setTrainedRecords((prev) => ({
            ...prev,
            [recordKey]: result.outpath
          }))
          successCount++
        } else {
          successCount++
        }
      } catch (error) {
        console.error('Error during batch training:', error)
        errorCount++
        showError('训练失败', `训练失败: ${record.speaker} - ${error.message}`)
      } finally {
        // Remove the training state for this record
        setTrainingRecords((prev) => {
          const newRecords = { ...prev }
          delete newRecords[recordKey]
          return newRecords
        })
      }

      // Show progress update occasionally
      if ((i + 1) % 5 === 0 || i === tableData.length - 1) {
        showSuccess('批量训练进度', `已处理: ${i + 1}/${tableData.length} 条记录 (${successCount} 成功, ${errorCount} 失败)`)
      }
    }

    // Show final summary
    showSuccess('批量训练完成', `总处理: ${tableData.length} 条记录 (${successCount} 成功, ${errorCount} 失败)`)
  }

  return (
    <>
      <div style={{ padding: 10 }}>
        {
          // <Button type="primary" onClick={() => setIsMappingModalVisible(true)}>
        }
        <Button type="primary" onClick={openMappingModal}>
          角色配音
        </Button>
        <Button type="primary" style={{ marginLeft: 10 }} onClick={handleBatchTrain}>
          批量训练
        </Button>
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
