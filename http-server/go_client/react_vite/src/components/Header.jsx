import React from 'react';

const Header = () => {
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm z-10">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wider flex items-center text-slate-900">
          <svg className="w-7 h-7 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"></path></svg>
          AudioHub
        </h1>
        <div className="text-sm text-slate-500">
          Go + React Audio Player
        </div>
      </div>
    </header>
  );
};

export default Header;
