import React, { useState, useRef, useEffect } from 'react';
import { Play, RefreshCw } from 'lucide-react';

interface LazyVideoPlayerProps {
  src?: string;
  youtubeId?: string;
  startTime: number;
  endTime: number;
  imageColor: string;
}

const LazyVideoPlayer: React.FC<LazyVideoPlayerProps> = ({ src, youtubeId, startTime, endTime, imageColor }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setIsLoaded(true);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying && videoRef.current && !youtubeId) {
      videoRef.current.play().catch(err => {
        // Handle autoplay restrictions if necessary, though it's triggered by click
        console.error("Video play failed:", err);
      });
    }
  }, [isLoaded, isPlaying, youtubeId]);

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-brand-cream/30 bg-black shadow-inner group">
      {!isLoaded ? (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer transition-all duration-500"
          style={{ backgroundColor: imageColor }}
          onClick={handlePlay}
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 group-hover:from-black/20 transition-all duration-500" />
          
          {/* Play Button UI */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-2xl group-hover:scale-110 group-hover:bg-brand-orange group-hover:border-brand-orange transition-all duration-300">
              <Play size={32} className="text-white fill-white ml-1" />
            </div>
            <div className="px-4 py-1.5 bg-black/40 backdrop-blur-sm rounded-full border border-white/10">
              <p className="text-white text-[10px] font-bold uppercase tracking-widest">Load Tutorial Segment</p>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 opacity-40 group-hover:opacity-100 transition-opacity">
            <div className="text-[9px] text-white font-mono bg-black/20 px-2 py-1 rounded">
              {Math.floor(startTime / 60)}:{(startTime % 60).toString().padStart(2, '0')} - {Math.floor(endTime / 60)}:{(endTime % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 w-full h-full bg-black">
          {youtubeId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeId}?start=${startTime}&end=${endTime}&autoplay=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              controls
              playsInline
              muted
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              {src && <source src={src} type="video/mp4" />}
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      )}
    </div>
  );
};

export default LazyVideoPlayer;
