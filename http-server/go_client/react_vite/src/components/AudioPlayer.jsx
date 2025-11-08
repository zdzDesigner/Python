import React from 'react';

const WelcomeScreen = () => (
  <div className="flex items-center justify-center h-full text-center text-slate-500">
    <div className="bg-white/50 backdrop-blur-sm p-12 rounded-3xl ring-1 ring-slate-200/80 shadow-lg animate-fade-in">
      <div className="text-7xl mb-5">🎧</div>
      <h3 className="text-2xl font-semibold text-slate-800">Select an Audio File</h3>
      <p className="mt-2 text-base text-slate-600">Choose a file from the library to start playing.</p>
    </div>
  </div>
);

const Player = ({ selectedFile, audioUrl }) => {
  const getIcon = () => {
    if (!selectedFile) return '🎵';
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    switch (extension) {
      case 'mp3': return '🎵';
      case 'wav': return '🔊';
      case 'ogg': return '🎶';
      case 'flac': return '🎼';
      default: return '🎵';
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden ring-1 ring-slate-200/50">
        <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-center">
          <div className="text-5xl mb-3 animate-bounce-short">
            {getIcon()}
          </div>
          <h3 className="font-bold text-xl truncate" title={selectedFile.name}>
            {selectedFile.name.split('/').pop()}
          </h3>
        </div>
        
        <div className="p-6">
          {audioUrl && (
            <div className="mb-6">
              <audio controls autoPlay className="w-full h-14" key={audioUrl}>
                <source src={audioUrl} type={`audio/${selectedFile.name.split('.').pop()}`} />
                Your browser does not support the audio element.
              </audio>
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
              <p className="font-mono text-xs break-all bg-white p-3 rounded border border-slate-200">
                {selectedFile.path}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AudioPlayer = ({ selectedFile, audioUrl }) => {
  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-slate-100/50">
      <div className="flex-1 overflow-y-auto p-6">
        {selectedFile ? (
          <Player selectedFile={selectedFile} audioUrl={audioUrl} />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </main>
  );
};

export default AudioPlayer;
