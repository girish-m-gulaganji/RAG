import React from 'react';
import { Play } from 'lucide-react';

export const CitationBadge = ({ citation, index }) => {
  const handleClick = () => {
    if (window.seekYouTubeLecture) {
      window.seekYouTubeLecture(citation.start_sec);
    } else {
      window.open(citation.url, '_blank');
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a212f] hover:bg-brand-500/20 border border-[#2c374d] hover:border-brand-500/50 text-gray-300 hover:text-brand-300 transition-all text-xs font-medium cursor-pointer shadow-sm group"
      title={`Jump to ${citation.timestamp} in lecture: "${citation.title}"`}
    >
      <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-400 group-hover:bg-brand-500 group-hover:text-white flex items-center justify-center text-[10px] font-bold transition-colors">
        {index !== undefined ? index + 1 : '▶'}
      </span>
      <span className="font-semibold text-brand-400">@{citation.timestamp}</span>
      <span className="truncate max-w-[130px] text-gray-400">{citation.title}</span>
      <Play className="w-2.5 h-2.5 text-brand-400 shrink-0 opacity-70 group-hover:opacity-100" />
    </button>
  );
};
