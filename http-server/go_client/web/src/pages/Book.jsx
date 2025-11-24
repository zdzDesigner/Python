import React, { useState, useCallback, useMemo, useRef } from 'react'
import { useNotification } from '@/utils/NotificationContext'
import { useAudioLibraryState, useAudioLibraryDispatch } from '@/context/AudioLibraryContext'
import { synthesizeTTS, deleteAudioFile } from '@/service/api/tts'

export const AudioBook = () => {
  console.log('xxxx')
  return <div className="flex flex-col h-screen bg-slate-50 text-slate-800 cursor-default">book</div>
}
