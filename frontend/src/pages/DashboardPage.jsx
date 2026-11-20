import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Video, 
  MessageSquare, 
  BookOpen, 
  HelpCircle, 
  Plus, 
  ArrowRight, 
  Clock, 
  Award,
  Layers
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.dashboard.getStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar title="Student Dashboard" subtitle="Overview of your video lectures, study notes, and quiz metrics" />

      <main className="p-6 max-w-7xl mx-auto w-full space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#121620] border border-[#232b3b] shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Processed Videos</span>
              <Video className="w-4 h-4 text-brand-500" />
            </div>
            <p className="text-2xl font-black text-white">{stats?.metrics?.total_videos ?? 0}</p>
            <p className="text-[11px] text-gray-400 mt-1">Available for AI tutoring</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#121620] border border-[#232b3b] shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Study Notes</span>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats?.metrics?.total_notes ?? 0}</p>
            <p className="text-[11px] text-gray-400 mt-1">Synthesized study guides</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#121620] border border-[#232b3b] shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Chat Discussions</span>
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats?.metrics?.total_conversations ?? 0}</p>
            <p className="text-[11px] text-gray-400 mt-1">Interactive Q&A sessions</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#121620] border border-[#232b3b] shadow-sm">
            <div className="flex items-center justify-between text-gray-400 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">Quiz Mastery</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{stats?.metrics?.average_quiz_score ?? 0}%</p>
            <p className="text-[11px] text-gray-400 mt-1">{stats?.metrics?.total_quiz_attempts ?? 0} tests completed</p>
          </div>
        </div>

        {/* Process New Video Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-900/30 via-[#161c28] to-[#121620] border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Have a new lecture to study?</h3>
            <p className="text-xs text-gray-400 mt-1">
              Paste any YouTube video link to extract transcripts, chunk content, and generate instant timestamped Q&A.
            </p>
          </div>
          <Link
            to="/process"
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Process New Video</span>
          </Link>
        </div>

        {/* Recent Videos Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-500" />
              <span>Your Processed Lectures</span>
            </h2>
            <Link to="/process" className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-48 rounded-2xl bg-[#121620] border border-[#232b3b] animate-shimmer" />
              ))}
            </div>
          ) : stats?.recent_videos?.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {stats.recent_videos.map((vid) => (
                <div
                  key={vid.id}
                  className="rounded-2xl bg-[#121620] border border-[#232b3b] overflow-hidden hover:border-[#38455e] transition-all flex flex-col group shadow-lg"
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <img
                      src={vid.thumbnail_url || `https://img.youtube.com/vi/${vid.youtube_id}/hqdefault.jpg`}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-semibold text-white">
                      {formatDuration(vid.duration_seconds)}
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-100 line-clamp-2">{vid.title}</h4>
                      <p className="text-xs text-gray-400 mt-1 font-medium">{vid.channel || 'YouTube'}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1f2738] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-gray-400">{vid.chunk_count} RAG chunks</span>
                      <button
                        onClick={() => navigate(`/chat?video_id=${vid.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-brand-500/15 hover:bg-brand-500 text-brand-400 hover:text-white font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <span>Study</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#121620] border border-dashed border-[#232b3b]">
              <Video className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-300 text-sm">No video lectures processed yet</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Paste your first YouTube educational video to unlock timestamp retrieval, study notes, and quizzes.
              </p>
              <Link
                to="/process"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Process First Video</span>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
