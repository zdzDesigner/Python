import React, { useState } from 'react';

const TtsSynthesizer = ({ onSynthesize, isSynthesizing, selectedFile }) => {
  const [text, setText] = useState('你好，这是一个在网页上生成的语音。');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isSynthesizing) return;
    onSynthesize(text);
  };

  const referenceVoice = selectedFile ? selectedFile.Name.split('/').pop() : 'Default';

  return (
    <div className="p-4 border-t border-slate-200">
      <h3 className="text-lg font-semibold flex items-center text-slate-800 mb-3">
        <svg className="w-6 h-6 mr-2.5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
        Text-to-Speech
      </h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-24 p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-none"
          placeholder="Enter text to synthesize..."
          disabled={isSynthesizing}
        />
        <button
          type="submit"
          disabled={isSynthesizing || !text.trim()}
          className="mt-3 w-full flex justify-center items-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isSynthesizing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Audio'
          )}
        </button>
        <div className="text-xs text-center text-slate-500 mt-2.5 px-2 py-1.5 bg-slate-100 rounded-md">
          Reference voice: <span className="font-semibold text-slate-700 truncate">{referenceVoice}</span>
        </div>
      </form>
    </div>
  );
};

export default TtsSynthesizer;
