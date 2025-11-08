import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Typography } from 'antd'
import { audio_text } from '../assets/audio_text'

const { Text } = Typography

const TTSList = ({ jsonData }) => {
  const [ttsData, setTtsData] = useState([])
  jsonData = JSON.stringify(audio_text)

  useEffect(() => {
    if (jsonData) {
      try {
        const parsedData = JSON.parse(jsonData)
        if (Array.isArray(parsedData)) {
          setTtsData(parsedData)
        } else {
          console.error('JSON data is not an array')
        }
      } catch (error) {
        console.error('Error parsing JSON data:', error)
      }
    } else {
      // Clear the data if jsonData is null/undefined
      setTtsData([])
    }
  }, [jsonData])

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
      render: (speaker) => <Text strong>{speaker || 'N/A'}</Text>
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
    }
  ]

  {
    // <Card className="w-full mt-4">
    // </Card>
  }
  return (
    <Table
      style={{ padding: 10, backgroundColor:'#fff'}}
      dataSource={ttsData}
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
      scroll={{ y: 'calc(100vh - 200px)' }}
      locale={{
        emptyText: jsonData ? 'JSON数据有效但不包含TTS条目' : '尚未提供JSON数据'
      }}
    />
  )
}

export default TTSList
