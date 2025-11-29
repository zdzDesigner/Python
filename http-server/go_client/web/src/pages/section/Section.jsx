import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Card, Table, Tag, Typography, Select, Button, Space, Modal, Input, InputNumber, Popconfirm } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'

import { useAudioLibraryState, useAudioLibraryDispatch } from '@/context/AudioLibraryContext'
import TTSList from './TTSList'
import SectionList from './SectionList'
import Progress from '@/components/Progress'

export const AudioSection = () => {
  const { section_id: router_section_id, book_id } = useParams()
  const navigate = useNavigate()
  const sectionListRef = useRef(null)
  const { audioFiles } = useAudioLibraryState()
  const [isshow_dubbing, setShowDubbing] = useState(false)
  const [characterMappings, setCharacterMappings] = useState({})
  const [ttsdata, setTtsData] = useState([])
  const [section_id, setSectionId] = useState(+router_section_id)

  const hookSections = useCallback((sections) => {
    console.log({ sections })
    if (section_id == 0 && sections.length > 0) {
      setSectionId(sections[0].id)
    }
  }, [])

  const uniqueCharacterNames = useMemo(() => {
    if (!ttsdata) return []
    const uniqueNames = [...new Set(ttsdata.map((item) => item.speaker))]
    return uniqueNames
  }, [ttsdata])
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

  // dubbing ====================================
  const dubModalOpen = useCallback(() => {
    const initialMappings = {}
    if (ttsdata) {
      ttsdata.forEach((item) => {
        if (item.dubbing && item.dubbing !== '') initialMappings[item.speaker] = item.dubbing
      })
    }
    setCharacterMappings(initialMappings)
    setShowDubbing(true)
  }, [ttsdata])

  const dubModalOk = useCallback(() => {
    // 批量设置音色
    setTtsData((prevData) => {
      return prevData.map((item) => {
        if (characterMappings[item.speaker]) return { ...item, dubbing: characterMappings[item.speaker] }
        return item
      })
    })
    setShowDubbing(false)
  }, [characterMappings])

  // Function to handle modal cancellation
  const dubModalCancel = useCallback(() => {
    setShowDubbing(false)
    setCharacterMappings({})
  }, [])

  const TPLHeader = () => {
    return (
      <div className="flex w-full bg-white/80 backdrop-blur-lg border-b border-slate-200 p-3 flex justify-end items-center space-x-3">
        <div>
          <LeftOutlined onClick={() => navigate('/audiobook/list')} style={{ cursor: 'pointer' }} /> 小说名称
        </div>
        <div className="flex-1"></div>
        <div>
          <Button type="primary" className="ml-[10px]" onClick={() => sectionListRef.current.addNewSection()}>
            添加章节
          </Button>
          <Button type="primary" className="ml-[10px]" onClick={dubModalOpen}>
            角色配音
          </Button>
        </div>
        {
          <Modal title="角色配音" open={isshow_dubbing} onOk={dubModalOk} onCancel={dubModalCancel} width={600}>
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
      </div>
    )
  }
  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 cursor-default">
      <div className="flex flex-col w-full h-full">
        <TPLHeader />
        <div className="flex flex-1">
          <SectionList ref={sectionListRef} book_id={book_id} section_id={section_id} hookSections={hookSections} />
          <div className="pl-1 overflow-auto">{section_id > 0 && <TTSList section_id={section_id} ttsdata={ttsdata} setTtsData={setTtsData} />}</div>
        </div>
        <Progress />
      </div>
    </div>
  )
}
