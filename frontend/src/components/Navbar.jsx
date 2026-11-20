import React from 'react';
import { Sparkles, Video } from 'lucide-react';

export const Navbar = ({ title, subtitle, selectedVideo, onSelectVideoChange, videos = [] }) => {
  return (
    <header className="h-16 border-b border-[#242c3d] bg-[#10141d]/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 font-medium">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {videos.length > 0 && onSelectVideoChange && (
          <div className="flex items-center gap-2 bg-[#181f2c] border border-[#2b3548] rounded-xl px-3 py-1.5 shadow-sm">
            <Video className="w-4 h-4 text-brand-500 shrink-0" />
            <select
              value={selectedVideo?.id || ''}
              onChange={(e) => {
                const vid = videos.find((v) => v.id === Number(e.target.value));
                if (vid) onSelectVideoChange(vid);
              }}
              className="bg-transparent text-xs text-gray-200 font-medium focus:outline-none cursor-pointer max-w-[240px] truncate"
            >
              {videos.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#121722] text-gray-200">
                  {v.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          AI RAG Online
        </div>
      </div>
    </header>
  );
};
