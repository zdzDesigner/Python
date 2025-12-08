import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Card, Table, Tag, Typography, Select, Button, Space, Modal, Input, InputNumber, Popconfirm } from 'antd'
import { LeftOutlined, CloseOutlined, UserOutlined, PlayCircleOutlined, PauseCircleOutlined, SwapOutlined, PlusOutlined } from '@ant-design/icons'
import { useNavigate, useLocation, useParams } from 'react-router-dom'

import { useAudioLibraryState, useAudioLibraryDispatch } from '@/context/AudioLibraryContext'
import TTSList from './TTSList'
import SectionList from './SectionList'
import Progress from '@/components/Progress'
import { DubbingList, CSS_CARD } from '@/pages/dubbing/Dubbing'

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
  const audioPlayerRef = useRef(null)
  const [currentPlayingId, setCurrentPlayingId] = useState(null)

  useEffect(() => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio()
    }
  }, [])

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
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {uniqueCharacterNames.map((characterName) => {
                    const selectedVoice = (selectedCharacterVoices[characterName] || [])[0]
                    const hasValidWavPath = selectedVoice && selectedVoice.wav_path && selectedVoice.wav_path.trim() !== ''
                    const [hovered, setHovered] = useState(false)

                    const getAvatarUrl = () => {
                      if (!selectedVoice || !selectedVoice.avatar) return null
                      return selectedVoice.avatar
                    }

                    const getAudioUrl = () => {
                      if (!selectedVoice || !selectedVoice.wav_path) return null
                      return selectedVoice.wav_path
                    }

                    const isPlaying = selectedVoice && currentPlayingId === selectedVoice.id

                    const togglePlay = () => {
                      if (!selectedVoice) return
                      const audioUrl = getAudioUrl()
                      if (!audioUrl) return

                      if (isPlaying) {
                        audioPlayerRef.current.pause()
                        setCurrentPlayingId(null)
                      } else {
                        setCurrentPlayingId(selectedVoice.id)
                        audioPlayerRef.current.src = audioUrl
                        audioPlayerRef.current.play()
                      }
                    }

                    return (
                      <div
                        key={characterName}
                        className={`${CSS_CARD} Card`}
                        style={{ position: 'relative' }}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                      >
                        <div className="absolute w-full z-100 top-2 right-2 flex gap-1">
                          <div className="flex-1" />
                          <Button
                            size="small"
                            type="primary"
                            shape="circle"
                            icon={hasValidWavPath ? <SwapOutlined /> : <PlusOutlined />}
                            onClick={() => openVoiceSelectionModal(characterName)}
                          />
                        </div>

                        <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border-2 border-gray-200 relative">
                          {selectedVoice && selectedVoice.avatar ? (
                            <img src={getAvatarUrl()} alt={selectedVoice.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl text-gray-500">
                              <UserOutlined />
                            </div>
                          )}

                          {selectedVoice && selectedVoice.wav_path && (
                            <div
                              className="absolute inset-0 flex items-center justify-center rounded-full cursor-pointer duration-300 hover:bg-black/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                togglePlay()
                              }}
                            >
                              <Button
                                className={`playing ${!isPlaying && 'opacity-0'}`}
                                type="default"
                                shape="circle"
                                icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                                size="large"
                              />
                            </div>
                          )}
                        </div>

                        <div className="font-bold mb-1 text-sm">
                          {selectedVoice ? `${selectedVoice.name} · ${selectedVoice.age_text || ''}` : `${characterName} · 未选择`}
                        </div>

                        <div className="text-gray-600 min-h-1 items-center justify-center text-xs">{selectedVoice ? selectedVoice.emotion_text : ''}</div>
                      </div>
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
            mask={false}
            style={{ top: 20 }}
            destroyOnHidden
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
