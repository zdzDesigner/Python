import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import AudioPlayer from './components/AudioPlayer';
import Footer from './components/Footer';
import { buildFileTree } from './utils/fileTree';
import './App.css';

const App = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileTree, setFileTree] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const fetchAudioFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8081/api/audio-files');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAudioFiles(data.files || []);
      setFileTree(buildFileTree(data.files));
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching audio files:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudioFiles();
  }, [fetchAudioFiles]);

  const handleFileSelect = (fileData) => {
    setSelectedFile(fileData);
    setAudioUrl(`http://localhost:8081${fileData.URL}`);
  };

  const handleSynthesize = useCallback(async (text) => {
    setIsSynthesizing(true);
    try {
      // Use the selected file's path as the speaker audio, or a default if none is selected.
      const speakerAudioPath = selectedFile 
        ? selectedFile.Path 
        : "/home/zdz/temp/TTS/assets/self_voice.wav";

      const requestBody = {
        text: text,
        speaker_audio_path: speakerAudioPath,
        output_wav_path: `/home/zdz/Documents/Try/TTS/audio/audiobook_manager/wav/synthesis_${Date.now()}.wav`,
        emotion_text: "default",
        emotion_alpha: 0.7,
        interval_silence: 500,
      };

      const response = await fetch('http://localhost:8081/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`TTS API error! status: ${response.status}, body: ${errorBody}`);
      }

      const result = await response.json();

      // Immediately select the new file for playback
      if (result.newFile) {
        handleFileSelect(result.newFile);
      }

      // Refresh the file list to show the new file in the sidebar
      await fetchAudioFiles();

    } catch (err) {
      console.error('Error synthesizing audio:', err);
      // Optionally, set an error state to show in the UI
    } finally {
      setIsSynthesizing(false);
    }
  }, [fetchAudioFiles, selectedFile]); // Add selectedFile to the dependency array

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          audioFilesCount={audioFiles.length}
          loading={loading}
          error={error}
          fileTree={fileTree}
          onSelectFile={handleFileSelect}
          onSynthesize={handleSynthesize}
          isSynthesizing={isSynthesizing}
          selectedFile={selectedFile} // Pass selectedFile down
        />
        <AudioPlayer 
          selectedFile={selectedFile}
          audioUrl={audioUrl}
        />
      </div>

      <Footer />
    </div>
  );
};

export default App;
