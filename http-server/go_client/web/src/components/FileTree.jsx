import React, { useState } from 'react'
import { DeleteOutlined, CloseOutlined } from '@ant-design/icons'

// Internal component to render each item in the tree recursively
const TreeItem = ({ item, level = 0, onSelectFile, onDeleteFile, currentlyPlaying, onPauseCurrent }) => {
  const [isExpanded, setIsExpanded] = useState(level < 1) // Auto-expand first level
  const [showDelete, setShowDelete] = useState(false)
  const marginLeft = `${level * 0}px`
  const hasChildren = item.children && item.children.length > 0
  const isfolder = item.type === 'folder'
  const isPlaying = item.type === 'file' && currentlyPlaying === item.data.path


  const getIcon = () => {
    if (isfolder) {
      return isExpanded ? '📂' : '📁'
    } else {
      const extension = item.name.split('.').pop().toLowerCase()
      switch (extension) {
        case 'mp3':
          return '🎵'
        case 'wav':
          return '🔊'
        case 'ogg':
          return '🎶'
        case 'flac':
          return '🎼'
        default:
          return '🎵'
      }
    }
  }

  // Common wrapper div props for both files and folders
  const commonWrapperProps = {
    className: `flex items-center px-2 rounded-lg cursor-default transition-all duration-200 ${
      isPlaying 
        ? 'bg-indigo-100 border-l-4 border-indigo-500' 
        : `${isfolder && isExpanded ? 'bg-slate-50' : ''} hover:bg-slate-100`
    } relative`,
    style: { marginLeft },
    onMouseEnter: () => setShowDelete(true),
    onMouseLeave: () => setShowDelete(false)
  }

  // Common content for both files and folders
  const itemContent = (
    <>
      {isfolder && (
        <span className="inline-block mr-2 text-sm transition-transform duration-200 text-slate-500" style={{ transform: isExpanded ? 'rotate(90deg)' : '' }}>
          ▶
        </span>
      )}
      <span className={`mr-2 p-2 ${isfolder ? 'text-ms' : 'text-xs'}`}>{getIcon()}</span>
      <span className={`truncate flex-grow ${isfolder ? 'text-sm font-semibold' : 'text-sm font-medium'}`} title={item.name}>
        {item.name}
      </span>
      {showDelete && (
        <CloseOutlined
          onClick={(e) => {
            e.stopPropagation()
            console.log(item.data)
            onDeleteFile(item.data.name)
          }}
          title={`Delete ${item.type}`}
        />
        // <button
        //   className="ml-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center transition-all duration-200"
        //   onClick={(e) => {
        //     e.stopPropagation()
        //     onDeleteFile(item.data.path)
        //   }}
        //   title={`Delete ${item.type}`}
        // >
        //   {
        //     // <DeleteOutlined className="text-xs" />
        //   }
        //   <CloseOutlined />
        // </button>
      )}
    </>
  )

  if (item.type === 'file') {
    return (
      <div 
        {...commonWrapperProps} 
        className={`${commonWrapperProps.className}`} 
        onClick={() => {
          if (isPlaying && onPauseCurrent) {
            // If the item clicked is the currently playing file, toggle it
            onPauseCurrent();
          } else {
            onSelectFile(item.data);
          }
        }}
      >
        {itemContent}
      </div>
    )
  }

  return (
    <div>
      <div className="py-1" onClick={() => setIsExpanded(!isExpanded)}>{itemContent}</div>
      {isExpanded && hasChildren && (
        <div className="border-slate-200 ml-3.5">
          {item.children.map((child, index) => (
            <TreeItem 
              key={index} 
              item={child} 
              level={level + 1} 
              onSelectFile={onSelectFile} 
              onDeleteFile={onDeleteFile} 
              currentlyPlaying={currentlyPlaying} 
              onPauseCurrent={onPauseCurrent}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Main component to render the entire file tree
const FileTree = ({ fileTree, onSelectFile, onDeleteFile, currentlyPlaying, onPauseCurrent }) => {
  if (!fileTree || !fileTree.children || fileTree.children.length === 0) {
    return (
      <div className="text-center text-slate-500 py-16">
        <div className="text-5xl mb-4">📁</div>
        <p className="text-xl">No audio files found</p>
        <p className="text-sm mt-2">Check the source directory for audio files.</p>
      </div>
    )
  }

  return (
    <div>
      {fileTree.children.map((item, index) => (
        <TreeItem 
          key={index} 
          item={item} 
          level={0} 
          onSelectFile={onSelectFile} 
          onDeleteFile={onDeleteFile} 
          currentlyPlaying={currentlyPlaying} 
          onPauseCurrent={onPauseCurrent}
        />
      ))}
    </div>
  )
}

export default FileTree
