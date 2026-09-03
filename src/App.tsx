import React, { useState } from 'react';
import { CameraView } from './components/CameraView';

const App: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  if (error) {
    return (
      <div className="min-h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-center p-6 text-center font-mono">
        <div className="border border-red-500 p-6 rounded bg-red-950/30 max-w-sm w-full">
          <h2 className="text-xl font-bold mb-3 text-red-500">Camera / AI Error</h2>
          <p className="text-sm text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition tracking-widest"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-center p-8 font-mono relative">
        <h1 className="text-4xl font-bold mb-2 tracking-tighter">RETROLENS</h1>
        <p className="text-cyan-400 tracking-widest text-sm mb-12">WEB EDITION</p>

        <div className="space-y-4 mb-12 text-sm text-gray-400 max-w-xs text-left border-l-2 border-cyan-500/50 pl-4">
          <p>1. Grant camera permission.</p>
          <p>2. Show both hands to form a portal.</p>
          <p>3. Pinch fingers to switch filters.</p>
        </div>
        
        <button 
          onClick={() => setStarted(true)}
          className="px-10 py-4 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-full hover:bg-cyan-500/30 active:scale-95 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] font-bold tracking-widest"
        >
          START CAMERA
        </button>
        
        <p className="absolute bottom-8 text-[10px] text-gray-600 max-w-xs text-center">
          100% Client-side processing.<br/>Your camera feed never leaves this device.
        </p>
      </div>
    );
  }

  // PERBAIKAN: Type-safe function wrapping agar tidak bentrok dengan Dispatch tipe React
  return <CameraView onError={(msg) => setError(msg)} />;
};

export default App;
