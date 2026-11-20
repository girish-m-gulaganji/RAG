import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Video, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Play, 
  Sparkles,
  Clock,
  Layers
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';

export const VideoProcessPage = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successVideo, setSuccessVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [fetchingList, setFetchingList] = useState(true);
  const navigate = useNavigate();

  const loadVideos = async () => {
    try {
      const data = await api.videos.list();
      setVideos(data.videos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingList(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleProcess = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError('');
    setSuccessVideo(null);
    setLoading(true);

    try {
      const video = await api.videos.process(url);
      setSuccessVideo(video);
      setUrl('');
      loadVideos();
    } catch (err) {
      setError(err.message || 'Failed to process YouTube video.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this lecture and all associated chats & notes?')) return;
    try {
      await api.videos.delete(id);
      setVideos(videos.filter((v) => v.id !== id));
      if (successVideo?.id === id) setSuccessVideo(null);
    } catch (err) {
      alert(err.message || 'Failed to delete video.');
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar title="Process YouTube Video" subtitle="Ingest any educational YouTube video into your vector database" />

      <main className="p-6 max-w-5xl mx-auto w-full space-y-8">
        {/* Processing Box */}
        <div className="p-8 rounded-2xl bg-[#121620] border border-[#232b3b] shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Add New Video Lecture</h2>
              <p className="text-xs text-gray-400">Supports standard videos, youtu.be links, and shorts with captions</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleProcess} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 rounded-xl bg-[#171d2a] border border-[#263145] text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono text-xs sm:text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Extracting & Chunking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Process Video</span>
                </>
              )}
            </button>
          </form>

          {/* Quick example */}
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <span>Quick test:</span>
            <button
              type="button"
              onClick={() => setUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
              className="text-brand-400 hover:underline cursor-pointer"
            >
              Sample Video URL
            </button>
          </div>
        </div>

        {/* Success Preview Card */}
        {successVideo && (
          <div className="p-6 rounded-2xl bg-[#141b26] border border-emerald-500/30 shadow-xl flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-64 aspect-video rounded-xl bg-black overflow-hidden relative shrink-0">
              <img
                src={successVideo.thumbnail_url}
                alt={successVideo.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for AI Learning</span>
              </div>
              <h3 className="text-base font-bold text-white">{successVideo.title}</h3>
              <p className="text-xs text-gray-400">{successVideo.channel} • {successVideo.chunk_count} RAG Chunks Indexed</p>

              <div className="pt-2 flex flex-wrap gap-2.5">
                <button
                  onClick={() => navigate(`/chat?video_id=${successVideo.id}`)}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Ask Questions (Chat)</span>
                </button>
                <button
                  onClick={() => navigate(`/summaries?video_id=${successVideo.id}`)}
                  className="px-4 py-2 rounded-xl bg-[#20293a] hover:bg-[#283449] border border-[#2e3b52] text-gray-200 font-semibold text-xs transition-all cursor-pointer"
                >
                  View Summary
                </button>
                <button
                  onClick={() => navigate(`/quizzes?video_id=${successVideo.id}`)}
                  className="px-4 py-2 rounded-xl bg-[#20293a] hover:bg-[#283449] border border-[#2e3b52] text-gray-200 font-semibold text-xs transition-all cursor-pointer"
                >
                  Take Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Processed Videos List */}
        <div>
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-500" />
            <span>All Ingested Videos ({videos.length})</span>
          </h3>

          {fetchingList ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <div key={n} className="h-20 rounded-xl bg-[#121620] border border-[#232b3b] animate-shimmer" />
              ))}
            </div>
          ) : videos.length > 0 ? (
            <div className="space-y-3">
              {videos.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-xl bg-[#121620] border border-[#232b3b] flex items-center justify-between gap-4 hover:border-[#333e54] transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={v.thumbnail_url}
                      alt={v.title}
                      className="w-20 aspect-video rounded-lg object-cover bg-black shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-gray-100 truncate">{v.title}</h4>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{v.channel} • {v.chunk_count} chunks indexed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => navigate(`/chat?video_id=${v.id}`)}
                      className="px-3.5 py-1.5 rounded-lg bg-brand-500/15 hover:bg-brand-500 text-brand-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Study
                    </button>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete video"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-500 rounded-xl bg-[#121620] border border-[#232b3b]">
              No videos added yet. Submit a YouTube link above to get started.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
