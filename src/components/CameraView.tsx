import React, { useEffect, useRef, useState } from 'react';
import { Camera, SwitchCamera, Loader2, Maximize } from 'lucide-react';
import { HandTracker } from '../core/HandTracker';
import { PortalEngine } from '../core/PortalEngine';
import { Renderer, FILTERS } from '../core/Renderer';
import { smoothLandmarks, Landmark, Point } from '../core/MathUtils';

interface CameraViewProps { 
  onError: (msg: string) => void; 
}

export const CameraView: React.FC<CameraViewProps> = ({ onError }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [facingMode, setFacingMode] = useState<'user'|'environment'>('environment');
  const [uiFilterIndex, setUiFilterIndex] = useState(1);
  
  const filterRef = useRef(1);
  const facingModeRef = useRef(facingMode);
  const lastPinchTime = useRef(0);
  const smoothedLandmarks = useRef<Landmark[][] | null>(null);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };
  
  const nextFilter = () => {
    const next = (filterRef.current + 1) % FILTERS.length;
    filterRef.current = next;
    setUiFilterIndex(next);
  };

  const capture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/jpeg', 0.9);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RetroLens_${Date.now()}.jpg`;
    a.click();
  };

  const requestFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    facingModeRef.current = facingMode;
    let animationFrameId = 0;
    let stream: MediaStream | null = null;
    let renderer: Renderer | null = null;
    let isRunning = true;
    let lastTrackTime = 0;

    const start = async () => {
      try {
        setIsLoaded(false);
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Browser doesn't support camera or is not on HTTPS.");
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !isRunning) return;

        video.srcObject = stream;
        
        // Memastikan promise pada .play() tertangani agar lolos strict linting
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => { 
            video.play().catch(() => {}); 
            resolve(); 
          };
        });

        const handLandmarker = await HandTracker.getInstance();
        renderer = new Renderer(canvas);
        setIsLoaded(true);

        const renderLoop = (time: number) => {
          if (!isRunning) return;
          
          if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
            if (canvas.width !== video.videoWidth) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }

            const isMirrored = facingModeRef.current === 'user';
            let portalResult: Point[] | null = null; 
            
            if (time - lastTrackTime > 33) {
              const results = handLandmarker.detectForVideo(video, time);
              if (results.landmarks && results.landmarks.length > 0) {
                // Type assertion eksplisit untuk TypeScript strict checking
                smoothedLandmarks.current = smoothLandmarks(results.landmarks as Landmark[][], smoothedLandmarks.current, 0.4);
                
                if (PortalEngine.detectPinch(smoothedLandmarks.current)) {
                  if (time - lastPinchTime.current > 1000) {
                    nextFilter();
                    lastPinchTime.current = time;
                  }
                }
              } else {
                smoothedLandmarks.current = null;
              }
              lastTrackTime = time;
            }

            if (smoothedLandmarks.current) {
              portalResult = PortalEngine.getPortalPolygon(smoothedLandmarks.current, canvas.width, canvas.height, isMirrored);
            }

            if (renderer) {
              renderer.render(video, canvas.width, canvas.height, portalResult, filterRef.current, isMirrored);
            }
          }
          animationFrameId = requestAnimationFrame(renderLoop);
        };

        animationFrameId = requestAnimationFrame(renderLoop);

      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          onError("Camera permission denied. Please allow camera access.");
        } else {
          onError(err.message || "Failed to initialize camera or AI model.");
        }
      }
    };

    start();

    return () => {
      isRunning = false;
      if (animationFrameId !== 0) cancelAnimationFrame(animationFrameId);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, onError]);

  return (
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden no-select">
      <video ref={videoRef} className="hidden" playsInline muted autoPlay />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 text-white z-50">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-cyan-400" />
          <p className="font-mono text-sm tracking-wider animate-pulse">CONNECTING CAMERA & AI...</p>
        </div>
      )}

      {isLoaded && (
        <>
          <button onClick={requestFullscreen} className="absolute top-6 right-6 p-3 rounded-full bg-black/30 backdrop-blur border border-white/10 text-white z-20 active:scale-90 transition">
            <Maximize size={20} />
          </button>

          <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col gap-6 bg-gradient-to-t from-black via-black/80 to-transparent z-10 pb-12">
            <div className="text-center font-mono text-white text-sm tracking-widest uppercase shadow-black drop-shadow-md">
              [ {FILTERS[uiFilterIndex].name} ]
            </div>
            
            <div className="flex justify-between items-center px-4 max-w-md mx-auto w-full">
              <button onClick={toggleCamera} className="p-4 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white active:scale-90 transition">
                <SwitchCamera size={24} />
              </button>
              
              <button onClick={capture} className="w-20 h-20 rounded-full border-4 border-white/80 flex items-center justify-center active:scale-90 transition shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur" />
              </button>
              
              <button onClick={nextFilter} className="p-4 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white active:scale-90 transition">
                <Camera size={24} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
