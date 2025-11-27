import React, { useState, useCallback, useMemo, useRef } from 'react'
import TTSList from '@/components/TTSList'
import SectionList from '@/components/SectionList'
import Progress from '@/components/Progress'
import { LeftOutlined } from '@ant-design/icons'

export const AudioSection = () => {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 cursor-default">
      <div className="flex flex-col w-full h-full">
        <div className="flex w-full bg-white/80 backdrop-blur-lg border-b border-slate-200 p-3 flex justify-end items-center space-x-3">
          <div><LeftOutlined /> 小说名称</div>
          <div className='flex-1'></div>
          <div></div>
        </div>
        <div className="flex flex-1">
          <SectionList />
          <div className="pl-1 overflow-auto">
            <TTSList />
          </div>
        </div>
        <Progress />
      </div>
    </div>
  )
}
