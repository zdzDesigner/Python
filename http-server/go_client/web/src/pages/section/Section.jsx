import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Card, Table, Tag, Typography, Select, Button, Space, Modal, Input, InputNumber, Popconfirm } from 'antd'
import { LeftOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigate, useLocation, useParams } from 'react-router-dom'

import { useAudioLibraryState, useAudioLibraryDispatch } from '@/context/AudioLibraryContext'
import TTSList from './TTSList'
import SectionList from './SectionList'
import Progress from '@/components/Progress'
import { DubbingList } from '@/pages/dubbing/Dubbing'

export const AudioSection = () => {
  const { section_id: router_section_id, book_id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [title, setTitle] = useState(location.state?.key)
  console.log('location.state:', location.state)
  useEffect(() => {
    console.log(title)
  }, [title])

  const sectionListRef = useRef(null)
  const { audioFiles } = useAudioLibraryState()
  const [isshow_dubbing, setShowDubbing] = useState(false)
  const [characterMappings, setCharacterMappings] = useState({})
  const [ttsdata, setTtsData] = useState([])
  const [section_id, setSectionId] = useState(+router_section_id)
  const [selectedCharacterVoices, setSelectedCharacterVoices] = useState({})
  const [selectingCharacter, setSelectingCharacter] = useState(null)

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
    const initialSelectedVoices = {}
    if (ttsdata) {
      ttsdata.forEach((item) => {
        if (item.dubbing && item.dubbing !== '') {
          initialMappings[item.speaker] = item.dubbing
          // Initialize selected voices from existing data
          if (!initialSelectedVoices[item.speaker]) {
            initialSelectedVoices[item.speaker] = []
          }
        }
      })
    }
    setCharacterMappings(initialMappings)
    setSelectedCharacterVoices(initialSelectedVoices)
    setShowDubbing(true)
  }, [ttsdata])

  const openVoiceSelectionModal = useCallback((characterName) => {
    setSelectingCharacter(characterName)
  }, [])

  const closeVoiceSelectionModal = useCallback(() => {
    setSelectingCharacter(null)
  }, [])

  const handleVoiceSelect = useCallback(
    (voice) => {
      if (!selectingCharacter) return

      setSelectedCharacterVoices((prev) => ({
        ...prev,
        [selectingCharacter]: [voice]
      }))

      closeVoiceSelectionModal()
    },
    [selectingCharacter, closeVoiceSelectionModal]
  )

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
    setSelectedCharacterVoices({})
  }, [])

  const TPLHeader = () => {
    return (
      <div className="flex w-full bg-white/80 backdrop-blur-lg border-b border-slate-200 p-3 flex justify-end items-center space-x-3">
        <div>
          <LeftOutlined onClick={() => navigate('/audiobook/list')} style={{ cursor: 'pointer' }} /> {title}
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
        <>
          <Modal title="角色配音" open={isshow_dubbing} onOk={dubModalOk} onCancel={dubModalCancel} width={900} transitionName="" maskTransitionName="">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <div style={{ marginBottom: '12px', fontWeight: 'bold' }}>已选择的角色配音:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {uniqueCharacterNames.map((characterName) => {
                    const selectedVoice = (selectedCharacterVoices[characterName] || [])[0]
                    const hasValidWavPath = selectedVoice && selectedVoice.wav_path && selectedVoice.wav_path.trim() !== ''

                    return (
                      <Card
                        key={characterName}
                        style={{ width: '200px' }}
                        extra={
                          <Button size="small" type="link" onClick={() => openVoiceSelectionModal(characterName)}>
                            {hasValidWavPath ? '替换' : '添加'}
                          </Button>
                        }
                        title={characterName}
                      >
                        {selectedVoice ? (
                          <div>
                            <div>
                              <strong>{selectedVoice.name}</strong>
                            </div>
                            {selectedVoice.age_text && <div style={{ fontSize: '12px', color: '#666' }}>年龄: {selectedVoice.age_text}</div>}
                            {selectedVoice.emotion_text && <div style={{ fontSize: '12px', color: '#666' }}>情绪: {selectedVoice.emotion_text}</div>}
                          </div>
                        ) : (
                          <div style={{ color: '#999' }}>未选择</div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          </Modal>

          <Modal
            title="选择配音音色"
            open={selectingCharacter !== null}
            onCancel={closeVoiceSelectionModal}
            footer={null}
            width={900}
            destroyOnHidden
            mask={false}
            style={{ top: 20 }}
          >
            <DubbingList
              selectionMode={true}
              selectedVoices={selectingCharacter ? selectedCharacterVoices[selectingCharacter] || [] : []}
              onVoiceSelect={handleVoiceSelect}
            />
          </Modal>
        </>
      </div>
    )
  }
  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 cursor-default">
      <div className="flex flex-col w-full h-full">
        <TPLHeader />
        <div className="flex flex-1">
          <SectionList ref={sectionListRef} book_id={book_id} section_id={section_id} hookSections={hookSections} />
          <div className="pl-1 overflow-auto">
            {section_id > 0 && <TTSList book_id={book_id} section_id={section_id} ttsdata={ttsdata} setTtsData={setTtsData} />}
          </div>
        </div>
        <Progress />
      </div>
    </div>
  )
}
