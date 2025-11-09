import React from 'react'
import { Card, Table, Tag, Typography, Select, Button, Space } from 'antd'
import { PlayCircleOutlined, ExperimentOutlined } from '@ant-design/icons'
import { audio_text } from '@/assets/audio_text'

const { Text } = Typography
const { Option } = Select

const TTSList = ({ jsonData, audioFiles }) => {
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
      title: '配音',
      width: 150,
      dataIndex: 'dubbing',
      key: 'dubbing',
      render: (text, record) => (
        <Select style={{ width: '100%' }} defaultValue={text} onChange={(value) => console.log('Selected dubbing:', value, 'for record:', record)}>
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
      render: (text, record) => (
        <Space size="middle">
          <Button icon={<ExperimentOutlined />} onClick={() => console.log('Train action for:', record)} />
          <Button icon={<PlayCircleOutlined />} onClick={() => console.log('Play action for:', record)} />
        </Space>
      )
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
      scroll={{ y: 'calc(100vh - 200px)' }}
      locale={{
        emptyText: jsonData ? 'JSON数据有效但不包含TTS条目' : '尚未提供JSON数据'
      }}
    />
  )
}

export default TTSList
