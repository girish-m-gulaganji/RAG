import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Send, 
  Sparkles, 
  MessageSquare, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { VideoPlayer } from '../components/VideoPlayer';
import { CitationBadge } from '../components/CitationBadge';
import { api } from '../services/api';

export const ChatPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const videoIdParam = searchParams.get('video_id');

  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const messagesEndRef = useRef(null);

  // Load user videos
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

  // Load conversations when selectedVideo changes
  useEffect(() => {
    if (!selectedVideo) return;
    const fetchConvs = async () => {
      try {
        const convList = await api.chat.getConversations(selectedVideo.id);
        setConversations(convList || []);
        if (convList && convList.length > 0) {
          loadConversation(convList[0].id);
        } else {
          setActiveConvId(null);
          setMessages([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConvs();
  }, [selectedVideo]);

  const loadConversation = async (convId) => {
    setActiveConvId(convId);
    try {
      const data = await api.chat.getConversation(convId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!question.trim() || !selectedVideo || loading) return;

    const userText = question.trim();
    setQuestion('');
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      content: userText,
      citations: [],
      grounded: true,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const botResponse = await api.chat.sendMessage(selectedVideo.id, userText, activeConvId);
      if (!activeConvId) {
        setActiveConvId(botResponse.conversation_id);
        const updatedConvs = await api.chat.getConversations(selectedVideo.id);
        setConversations(updatedConvs);
      }
      setMessages((prev) => [...prev, botResponse]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Error: ${err.message || 'Failed to generate answer.'}`,
          citations: [],
          grounded: false,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <Navbar
        title="AI Tutor Chat"
        subtitle="Ask questions grounded in the video transcript with interactive timestamp seeking"
        selectedVideo={selectedVideo}
        onSelectVideoChange={(vid) => {
          setSelectedVideo(vid);
          setSearchParams({ video_id: vid.id });
        }}
        videos={videos}
      />

      {initialLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : !selectedVideo ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 rounded-2xl bg-[#121620] border border-[#232b3b]">
            <HelpCircle className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <h3 className="font-bold text-white text-base">No Videos Found</h3>
            <p className="text-xs text-gray-400 mt-2">
              Please process a YouTube video first to start asking questions with AI tutoring.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Pane: Interactive Video Player */}
          <div className="w-full lg:w-[480px] xl:w-[540px] border-r border-[#242c3d] bg-[#0c0f16] flex flex-col p-4 shrink-0 overflow-y-auto">
            <VideoPlayer videoId={selectedVideo.youtube_id} />

            <div className="mt-4 p-4 rounded-xl bg-[#121620] border border-[#232b3b]">
              <h3 className="text-sm font-bold text-white line-clamp-2">{selectedVideo.title}</h3>
              <p className="text-xs text-gray-400 mt-1">{selectedVideo.channel} • {selectedVideo.chunk_count} Transcribed Moments</p>
            </div>

            {/* Conversation Threads Sidebar */}
            <div className="mt-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chat Threads</span>
                <button
                  onClick={handleStartNewChat}
                  className="px-2 py-1 rounded-lg bg-brand-500/15 hover:bg-brand-500 text-brand-400 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Chat</span>
                </button>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-48 pr-1">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => loadConversation(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      activeConvId === c.id
                        ? 'bg-brand-500 text-white font-semibold'
                        : 'text-gray-400 hover:bg-[#181f2c] hover:text-gray-200'
                    }`}
                  >
                    <span className="truncate">{c.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Pane: AI Chat Conversation */}
          <div className="flex-1 flex flex-col bg-[#0b0d11] min-w-0">
            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-400 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Ask anything about this lecture</h3>
                  <p className="text-xs text-gray-400 mt-2">
                    Answers are mathematically grounded in the transcript excerpts with exact timestamps you can click to jump in the player.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['Explain the main concept in simple terms', 'What are the key takeaways?', 'What problem does this solve?'].map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuestion(q)}
                        className="px-3 py-1.5 rounded-xl bg-[#141924] hover:bg-[#1a2130] border border-[#242c3d] text-xs text-gray-300 transition-colors cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-brand-500 text-white font-medium shadow-md shadow-brand-500/20'
                          : 'bg-[#151a25] border border-[#263145] text-gray-100 shadow-lg'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>

                      {/* Timestamp Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#2a364a] flex flex-wrap gap-1.5 items-center">
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1">
                            Jump in Video:
                          </span>
                          {msg.citations.map((c, idx) => (
                            <CitationBadge key={idx} citation={c} index={idx} />
                          ))}
                        </div>
                      )}
                    </div>

                    {msg.role === 'assistant' && msg.grounded && (
                      <span className="text-[10px] text-emerald-400 font-semibold mt-1 px-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Grounded in lecture transcript
                      </span>
                    )}
                  </div>
                ))
              )}

              {loading && (
                <div className="flex items-start gap-3">
                  <div className="max-w-[70%] rounded-2xl px-5 py-3.5 bg-[#151a25] border border-[#263145] flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-400 font-medium">Retrieving timestamps & reasoning...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-[#10141d] border-t border-[#242c3d]">
              <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask any question about this lecture..."
                  className="flex-1 px-4 py-3 rounded-xl bg-[#171d2a] border border-[#263145] text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
