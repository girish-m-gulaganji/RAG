import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  BookOpen, 
  Sparkles, 
  Copy, 
  Check, 
  Edit3, 
  Save, 
  HelpCircle,
  FileDown
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';

export const StudyNotesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const videoIdParam = searchParams.get('video_id');

  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [note, setNote] = useState(null);
  const [markdown, setMarkdown] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
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

  // Fetch note
  useEffect(() => {
    if (!selectedVideo) return;
    const fetchNote = async () => {
      setNote(null);
      setMarkdown('');
      setIsEditing(false);
      try {
        const data = await api.notes.get(selectedVideo.id);
        setNote(data);
        setMarkdown(data.content_markdown);
      } catch (err) {
        // Not generated yet
      }
    };
    fetchNote();
  }, [selectedVideo]);

  const handleGenerateNotes = async () => {
    if (!selectedVideo || loading) return;
    setLoading(true);
    try {
      const data = await api.notes.generate(selectedVideo.id);
      setNote(data);
      setMarkdown(data.content_markdown);
    } catch (err) {
      alert(err.message || 'Failed to generate study notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!note) return;
    try {
      const updated = await api.notes.update(note.id, markdown);
      setNote(updated);
      setIsEditing(false);
    } catch (err) {
      alert(err.message || 'Failed to save note');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedVideo?.title || 'Lecture'}_Notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Study Notes"
        subtitle="AI-synthesized structured study guides with conceptual breakdowns and revision points"
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
        ) : !note ? (
          <div className="p-12 text-center rounded-2xl bg-[#121620] border border-[#232b3b] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Synthesize Study Notes for "{selectedVideo.title}"</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                Creates organized markdown notes with topic breakdown, code/math explanations, and rapid review checklists.
              </p>
            </div>
            <button
              onClick={handleGenerateNotes}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Synthesizing Markdown Notes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Study Guide</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between p-4 rounded-xl bg-[#121620] border border-[#232b3b] gap-3">
              <div>
                <h2 className="font-bold text-sm text-white">{note.title}</h2>
                <p className="text-xs text-gray-400">{selectedVideo.channel}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-[#181f2c] hover:bg-[#20293a] border border-[#2c374d] text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Copy Markdown"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-lg bg-[#181f2c] hover:bg-[#20293a] border border-[#2c374d] text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Export .md File"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>

                {isEditing ? (
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 rounded-lg bg-brand-500/15 hover:bg-brand-500 text-brand-400 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Note Content View / Editor */}
            <div className="p-8 rounded-2xl bg-[#121620] border border-[#232b3b] shadow-xl">
              {isEditing ? (
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  rows={25}
                  className="w-full bg-[#161c28] border border-[#2b3547] rounded-xl p-4 text-xs font-mono text-gray-100 focus:outline-none focus:border-brand-500 leading-relaxed resize-y"
                />
              ) : (
                <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-2xl prose-h1:text-white prose-h2:text-lg prose-h2:text-brand-400 prose-h2:border-b prose-h2:border-[#222a3a] prose-h2:pb-2 prose-h3:text-sm prose-h3:text-amber-400 prose-p:text-xs prose-p:text-gray-300 prose-p:leading-relaxed prose-li:text-xs prose-li:text-gray-300 prose-code:text-xs prose-code:font-mono prose-code:bg-[#1a212e] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-brand-300">
                  <ReactMarkdown>{markdown}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
