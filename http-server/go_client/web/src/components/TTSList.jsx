import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Typography, Select, Button, Space } from 'antd'
import { PlayCircleOutlined, ExperimentOutlined } from '@ant-design/icons'
import { audio_text } from '@/assets/audio_text'
import { synthesizeTTS } from '@/service/api/tts'
import { useNotification } from '@/utils/NotificationContext'

const { Text } = Typography
const { Option } = Select

const TTSList = ({ jsonData, audioFiles, onSynthesizeComplete }) => {
  // State to store the table height
  const [tableHeight, setTableHeight] = useState('calc(100vh - 200px)')
  // State to track currently training records
  const [trainingRecords, setTrainingRecords] = useState({});

  const { showError, showSuccess } = useNotification();

  // console.log({jsonData})
  jsonData = audio_text.map((item) => ({ ...item, dubbing: '请选择' }))

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

  const handleTrain = async (record) => {
    // Generate a unique key for the record
    const recordKey = `${record.speaker}-${record.content}`;
    
    // Mark this record as currently training
    setTrainingRecords(prev => ({ ...prev, [recordKey]: true }));

    try {
      console.log('Training with record:', record);

      // Call synthesizeTTS with the record data
      const result = await synthesizeTTS(null, null, record);

      // If result.newFile exists, notify parent component
      if (result.newFile && onSynthesizeComplete) {
        // onSynthesizeComplete(result.newFile);
        showSuccess('训练成功', '音频文件已生成');
      } else {
        showSuccess('训练成功', '音频文件已生成');
      }
    } catch (error) {
      console.error('Error during training:', error);
      showError('训练失败', error.message);
    } finally {
      // Remove the training state for this record
      setTrainingRecords(prev => {
        const newRecords = { ...prev };
        delete newRecords[recordKey];
        return newRecords;
      });
    }
  };

  const columns = [
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
      render: (text, record) => (
        <Select style={{ width: '100%' }} defaultValue={text} onChange={(value) => {
          console.log('Selected dubbing:', value, 'for record:', record)
          record.dubbing = value
        }}>
          {audioFiles &&
            audioFiles.map((file) => (
              <Option key={file.path} value={file.path}>
                {file.name}
              </Option>
            ))}
        </Select>
      )
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
        const recordKey = `${record.speaker}-${record.content}`;
        const isTraining = trainingRecords[recordKey];
        
        return (
          <Space size="middle">
            <Button 
              icon={<ExperimentOutlined />} 
              onClick={() => handleTrain(record)} 
              title="训练此条数据"
              loading={isTraining}
              disabled={isTraining}
            />
            <Button 
              icon={<PlayCircleOutlined />} 
              onClick={() => console.log('Play action for:', record)}
              disabled={isTraining}
            />
          </Space>
        );
      }
    }
  ]

  {
    // <Card className="w-full mt-4">
    // </Card>
  }
  return (
    <Table
      style={{ padding: 10, backgroundColor: '#fff' }}
      dataSource={jsonData}
      columns={columns}
      size="small"
      rowKey={(record, index) => `${record.speaker}-${record.content}-${index}`}
      pagination={false}
      // pagination={{
      //   pageSize: 10,
      //   showSizeChanger: true,
      //   showQuickJumper: true,
      //   showTotal: (total) => `共 ${total} 条`
      // }}
      scroll={{ y: tableHeight }}
      // scroll={{ y: tableHeight, x: 'max-content' }}
      locale={{
        emptyText: jsonData ? 'JSON数据有效但不包含TTS条目' : '尚未提供JSON数据'
      }}
    />
  )
}

export default TTSList
