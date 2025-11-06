import React, { useState, useEffect } from 'react';
import './App.css';

// Recursive Tree Item Component
const TreeItem = ({ item, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
  const marginLeft = `${level * 16}px`; // Reduced margin to accommodate fixed width
  // Parent nodes (level 0) have larger padding than child nodes
  const paddingClass = level === 0 ? 'p-3' : 'p-2';

  const hasChildren = item.children && item.children.length > 0;

  if (item.type === 'file') {
    return (
      <div 
        className={`${paddingClass} mb-1 hover:bg-gray-50 transition-colors duration-200 border border-gray-200 cursor-pointer overflow-hidden bg-white rounded`}
        style={{ marginLeft, width: '190px', maxWidth: '190px' }}
      >
        <div className="flex items-center truncate text-left">
          <span className="text-gray-700 text-sm truncate" title={item.name}>{item.name}</span>
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <div 
          className={`${paddingClass} rounded cursor-pointer hover:bg-gray-50 flex items-center truncate ${isExpanded ? 'bg-gray-50' : ''} border border-gray-200 bg-white`}
          style={{ marginLeft, width: '190px', maxWidth: '190px' }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="mr-2 text-gray-600 flex-shrink-0">
            {isExpanded ? '▼' : '►'}
          </span>
          <span className="text-gray-800 font-medium truncate text-left" title={item.name}>{item.name}</span>
        </div>
        {isExpanded && hasChildren && (
          <div className="ml-2"> {/* Smaller margin for children */}
            {item.children.map((child, index) => (
              <TreeItem key={index} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }
};

// Convert flat file list to tree structure
const buildFileTree = (files) => {
  const root = { name: 'Root', type: 'folder', children: [] };
  
  files.forEach(file => {
    const pathParts = file.Name.split('/');
    let currentLevel = root.children;
    
    pathParts.forEach((part, index) => {
      // Find if this part already exists in current level
      let existingPart = currentLevel.find(item => item.name === part);
      
      if (!existingPart) {
        if (index === pathParts.length - 1) {
          // This is a file
          existingPart = { name: part, type: 'file', data: file };
        } else {
          // This is a folder
          existingPart = { name: part, type: 'folder', children: [] };
        }
        currentLevel.push(existingPart);
      }
      
      // If this isn't the last part, move to the next level
      if (index < pathParts.length - 1 && existingPart.type === 'folder') {
        currentLevel = existingPart.children;
      }
    });
  });
  
  return root;
};

const App = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileTree, setFileTree] = useState(null);

  // 从Go后端API获取音频文件列表
  useEffect(() => {
    const fetchAudioFiles = async () => {
      try {
        // 从Go后端API获取音频文件列表
        const response = await fetch('http://localhost:8081/api/audio-files');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setAudioFiles(data.files);
        
        // Build tree structure
        const tree = buildFileTree(data.files);
        setFileTree(tree);
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error('Error fetching audio files:', err);
        
        // 为了演示目的，使用模拟数据
        const mockFiles = [
          { Name: "sample/audio1.mp3", Path: "/home/user/audio/audio1.mp3" },
          { Name: "sample/audio2.wav", Path: "/home/user/audio/audio2.wav" },
          { Name: "audiobook/chapter1.mp3", Path: "/home/user/audio/audiobook/chapter1.mp3" },
          { Name: "audiobook/chapter2.mp3", Path: "/home/user/audio/audiobook/chapter2.mp3" },
          { Name: "audiobook/subfolder/chapter3.mp3", Path: "/home/user/audio/audiobook/subfolder/chapter3.mp3" }
        ];
        setAudioFiles(mockFiles);
        
        const tree = buildFileTree(mockFiles);
        setFileTree(tree);
      }
    };

    fetchAudioFiles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-800">Audio File Tree</h1>
          <p className="text-gray-600">Displaying audio files in tree structure from the Go application</p>
        </div>
      </header>
      
      <main className="flex-1 flex px-4 py-6">
        {/* Left sidebar for audio file tree - fixed 200px width */}
        <div className="w-[200px] pr-4 flex-shrink-0">
          <div className="bg-white rounded-lg shadow p-4 h-full">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Audio File Tree</h2>
            
            {loading && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-sm text-gray-600">Loading...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-center text-xs">
                Error: {error}
              </div>
            )}
            
            {!loading && fileTree && (
              <div className="max-h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden">
                {fileTree.children && fileTree.children.length > 0 ? (
                  fileTree.children.map((item, index) => (
                    <TreeItem key={index} item={item} level={0} />
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm italic">No files</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - placeholder for content */}
        <div className="flex-1 pl-4">
          <div className="bg-white rounded-lg shadow p-6 h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>Select an audio file from the tree</p>
              <p className="mt-2">Additional content would appear here</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-4 text-center text-gray-500 text-sm">
        <p>Powered by Go and React with Vite</p>
      </footer>
    </div>
  );
};

export default App;