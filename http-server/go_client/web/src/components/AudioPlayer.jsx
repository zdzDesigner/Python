import React, { useState, useRef, useEffect } from 'react'

const WelcomeScreen = () => (
  <div className="flex items-center justify-center h-full text-center text-slate-500">
    <div className="bg-white/50 backdrop-blur-sm p-12 rounded-3xl ring-1 ring-slate-200/80 shadow-lg animate-fade-in">
      <div className="text-7xl mb-5">🎧</div>
      <h3 className="text-2xl font-semibold text-slate-800">Select an Audio File</h3>
      <p className="mt-2 text-base text-slate-600">Choose a file from the library to start playing.</p>
    </div>
  </div>
)

const Player = ({ selectedFile, audioUrl, onPlaybackComplete, onPauseRequested }) => {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(isPlaying) // Keep track of current isPlaying value
  useEffect(() => {
    isPlayingRef.current = isPlaying // Update ref when isPlaying state changes
  }, [isPlaying])
  const [progress, setProgress] = useState(0)

  const getIcon = () => {
    if (!selectedFile) return '🎵'
    const extension = selectedFile.name.split('.').pop().toLowerCase()
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

  const handlePlaybackComplete = () => {
    if (onPlaybackComplete) onPlaybackComplete()
    setIsPlaying(false)
    setProgress(0)
  }

  // Handle play/pause events
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
      isPlayingRef.current = !isPlaying
    }
  }

  // Update progress as audio plays and update the isPlaying ref
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }

    const handleLoadedMetadata = () => {
      setProgress(0)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      isPlayingRef.current = true
    }
    const handlePause = () => {
      setIsPlaying(false)
      isPlayingRef.current = false
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [])

  // When a new audioUrl is provided, reset state and potentially play
  useEffect(() => {
    if (audioUrl) {
      setProgress(0)
      // Only auto-play if this is a new file, not if we're resuming a paused file
      // We'll handle the play logic in the next effect after DOM update
      setIsPlaying(false)
      isPlayingRef.current = false
    }
  }, [audioUrl])

  // Auto-play when audio URL changes and it's a new selection
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      // Wait for the audio element to load the new source
      const handleCanPlay = () => {
        // Only auto-play if we're not resuming a toggle operation
        if (!isPlayingRef.current && audioRef.current) {
          audioRef.current.play()
          setIsPlaying(true)
          isPlayingRef.current = true
        }
      }

      audioRef.current.addEventListener('canplay', handleCanPlay)

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('canplay', handleCanPlay)
        }
      }
    }
  }, [audioUrl])

  // Expose the toggle functionality to parent component
  useEffect(() => {
    if (onPauseRequested) {
      onPauseRequested(() => {
        if (audioRef.current) {
          if (isPlayingRef.current) {
            // Currently playing, so pause it
            audioRef.current.pause()
            setIsPlaying(false)
            isPlayingRef.current = false
          } else {
            // Currently paused, so play it
            audioRef.current.play()
            setIsPlaying(true)
            isPlayingRef.current = true
          }
        }
      })
    }
  }, [onPauseRequested]) // Only depend on onPauseRequested

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden ring-1 ring-slate-200/50">
        <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-center">
          <div className="text-5xl mb-3 animate-bounce-short">{getIcon()}</div>
          <h3 className="font-bold text-xl truncate" title={selectedFile.name}>
            {selectedFile.name.split('/').pop()}
          </h3>
        </div>

        <div className="p-6">
          {audioUrl && (
            <div className="mb-6">
              <div className="mb-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlayPause}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors duration-200"
                >
                  {isPlaying ? (
                    <span className="text-xl">⏸</span> // Pause icon
                  ) : (
                    <span className="text-xl">▶</span> // Play icon
                  )}
                </button>
                <audio ref={audioRef} controls={false} className="w-full h-14" key={selectedFile.path} onEnded={handlePlaybackComplete}>
                  <source src={audioUrl} type={`audio/${selectedFile.name.split('.').pop()}`} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-slate-50/80 p-4 rounded-lg ring-1 ring-slate-200/50">
              <h4 className="font-semibold text-slate-600 mb-2">File Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="font-medium text-slate-800">{selectedFile.name.split('/').pop()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="font-medium text-slate-800">{selectedFile.name.split('.').pop().toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-lg ring-1 ring-slate-200/50">
              <h4 className="font-semibold text-slate-600 mb-2">Full Path</h4>
              <p className="font-mono text-xs break-all bg-white p-3 rounded border border-slate-200">{selectedFile.path}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const AudioPlayer = ({ selectedFile, audioUrl, onPlaybackComplete, onPauseRequested }) => {
  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-100/50">
      <div className="flex-1 overflow-y-auto p-6">
        {selectedFile ? (
          <Player selectedFile={selectedFile} audioUrl={audioUrl} onPlaybackComplete={onPlaybackComplete} onPauseRequested={onPauseRequested} />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </main>
  )
}

export default AudioPlayer
