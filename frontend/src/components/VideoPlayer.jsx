import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Play, Clock } from 'lucide-react';

export const VideoPlayer = ({ videoId, initialSeek = 0, onReady }) => {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState('00:00');

  useEffect(() => {
    // Load YouTube IFrame API if not already present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start: Math.floor(initialSeek),
        },
        events: {
          onReady: (event) => {
            setIsReady(true);
            if (onReady) onReady(playerRef.current);
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  const seekTo = (seconds) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds, true);
      playerRef.current.playVideo();
    } else {
      window.open(`https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}s`, '_blank');
    }
  };

  // Expose global seek handler so citation clicks anywhere on the page can jump
  useEffect(() => {
    window.seekYouTubeLecture = seekTo;
    return () => {
      window.seekYouTubeLecture = null;
    };
  }, [isReady]);

  return (
    <div className="bg-[#121620] border border-[#242c3d] rounded-2xl overflow-hidden shadow-xl">
      <div className="relative aspect-video bg-black">
        <div ref={containerRef} className="w-full h-full" />
      </div>
      <div className="p-3 bg-[#0e1219] border-t border-[#222938] flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-brand-500" />
          <span>Interactive Player Sync Active</span>
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-gray-400 hover:text-brand-400 font-medium transition-colors"
        >
          <span>Watch on YouTube</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
