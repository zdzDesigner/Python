import React, { useState } from 'react';

// Internal component to render each item in the tree recursively
const TreeItem = ({ item, level = 0, onSelectFile }) => {
  const [isExpanded, setIsExpanded] = useState(level < 1); // Auto-expand first level
  const marginLeft = `${level * 20}px`;
  const hasChildren = item.children && item.children.length > 0;

  const getIcon = () => {
    if (item.type === 'folder') {
      return isExpanded ? '📂' : '📁';
    } else {
      const extension = item.name.split('.').pop().toLowerCase();
      switch (extension) {
        case 'mp3': return '🎵';
        case 'wav': return '🔊';
        case 'ogg': return '🎶';
        case 'flac': return '🎼';
        default: return '🎵';
      }
    }
  };

  if (item.type === 'file') {
    return (
      <div 
        className="flex items-center p-2 mb-1.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-100 border border-transparent"
        style={{ marginLeft }}
        onClick={() => onSelectFile(item.data)}
      >
        <span className="mr-3 text-lg">{getIcon()}</span>
        <span className="text-slate-700 text-sm truncate font-medium" title={item.name}>
          {item.name}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div 
        className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 ${isExpanded ? 'bg-slate-50' : ''} hover:bg-slate-100`}
        style={{ marginLeft }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="mr-2 text-sm transition-transform duration-200 text-slate-500" style={{ transform: isExpanded ? 'rotate(90deg)' : '' }}>▶</span>
        <span className="mr-2 text-xl">{getIcon()}</span>
        <span className="text-slate-800 font-semibold truncate" title={item.name}>
          {item.name}
        </span>
      </div>
      {isExpanded && hasChildren && (
        <div className="mt-1 border-l-2 border-slate-200 ml-3.5 pl-3">
          {item.children.map((child, index) => (
            <TreeItem key={index} item={child} level={level + 1} onSelectFile={onSelectFile} />
          ))}
        </div>
      )}
    </div>
  );
};

// Main component to render the entire file tree
const FileTree = ({ fileTree, onSelectFile }) => {
  if (!fileTree || !fileTree.children || fileTree.children.length === 0) {
    return (
      <div className="text-center text-slate-500 py-16">
        <div className="text-5xl mb-4">📁</div>
        <p className="text-xl">No audio files found</p>
        <p className="text-sm mt-2">Check the source directory for audio files.</p>
      </div>
    );
  }

  return (
    <div>
      {fileTree.children.map((item, index) => (
        <TreeItem key={index} item={item} level={0} onSelectFile={onSelectFile} />
      ))}
    </div>
  );
};

export default FileTree;
