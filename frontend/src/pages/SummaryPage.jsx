import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  BookMarked, 
  ListOrdered, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';

export const SummaryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const videoIdParam = searchParams.get('video_id');

  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch videos
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await api.videos.list();
        const vList = res.videos || [];
        setVideos(vList);
        if (vList.length > 0) {
          const matched = videoIdParam
            ? vList.find((v) => v.id === Number(videoIdParam)) || vList[0]
            : vList[0];
          setSelectedVideo(matched);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchVideos();
  }, [videoIdParam]);

  // Fetch summary when video changes
  useEffect(() => {
    if (!selectedVideo) return;
    const fetchSummary = async () => {
      setSummary(null);
      try {
        const data = await api.summaries.get(selectedVideo.id);
        setSummary(data);
      } catch (err) {
        // Not generated yet
      }
    };
    fetchSummary();
  }, [selectedVideo]);

  const handleGenerateSummary = async () => {
    if (!selectedVideo || loading) return;
    setLoading(true);
    try {
      const data = await api.summaries.generate(selectedVideo.id);
      setSummary(data);
    } catch (err) {
      alert(err.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Lecture Summaries"
        subtitle="Multi-level executive summaries, key takeaways, and definition glossaries"
        selectedVideo={selectedVideo}
        onSelectVideoChange={(vid) => {
          setSelectedVideo(vid);
          setSearchParams({ video_id: vid.id });
        }}
        videos={videos}
      />

      <main className="p-6 max-w-5xl mx-auto w-full space-y-6 flex-1">
        {initialLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !selectedVideo ? (
          <div className="p-12 text-center rounded-2xl bg-[#121620] border border-[#232b3b]">
            <HelpCircle className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <h3 className="font-bold text-white text-base">No Videos Available</h3>
            <p className="text-xs text-gray-400 mt-1">Please process a video first.</p>
          </div>
        ) : !summary ? (
          <div className="p-12 text-center rounded-2xl bg-[#121620] border border-[#232b3b] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Generate Summary for "{selectedVideo.title}"</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                Creates an executive overview, detailed 4-paragraph breakdown, actionable takeaways, and a technical definitions dictionary.
              </p>
            </div>
            <button
              onClick={handleGenerateSummary}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Synthesizing Summary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Summary</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#121620] border border-[#232b3b]">
              <div>
                <h2 className="font-bold text-base text-white">{selectedVideo.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{selectedVideo.channel}</p>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={loading}
                className="px-3.5 py-1.5 rounded-lg bg-[#181f2c] hover:bg-[#20293a] border border-[#2c374d] text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                {loading ? 'Regenerating...' : 'Regenerate'}
              </button>
            </div>

            {/* Executive Short Summary */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-950/40 via-[#131722] to-[#121620] border border-brand-500/30 shadow-lg">
              <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-4 h-4" />
                <span>Executive Overview</span>
              </div>
              <p className="text-sm font-medium text-gray-100 leading-relaxed">
                {summary.short_summary}
              </p>
            </div>

            {/* Key Topics Covered */}
            {summary.key_topics?.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#121620] border border-[#232b3b]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-brand-500" />
                  <span>Key Topics Covered</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {summary.key_topics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-[#181f2c] border border-[#2b3648] text-xs font-medium text-gray-200"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Explanation */}
            <div className="p-6 rounded-2xl bg-[#121620] border border-[#232b3b]">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-500" />
                <span>Comprehensive Detailed Breakdown</span>
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                {summary.detailed_summary}
              </p>
            </div>

            {/* High-Yield Key Takeaways */}
            {summary.key_takeaways?.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#121620] border border-[#232b3b]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>High-Yield Key Takeaways</span>
                </h3>
                <ul className="space-y-2.5">
                  {summary.key_takeaways.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs text-gray-200">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Glossary / Definitions */}
            {summary.definitions?.length > 0 && (
              <div className="p-6 rounded-2xl bg-[#121620] border border-[#232b3b]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-amber-400" />
                  <span>Core Definitions & Vocabulary</span>
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {summary.definitions.map((def, i) => (
                    <div key={i} className="p-4 rounded-xl bg-[#161c28] border border-[#273244]">
                      <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider">{def.term}</h4>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">{def.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
