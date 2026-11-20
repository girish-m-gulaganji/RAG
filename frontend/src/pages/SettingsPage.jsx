import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import {
  User,
  Mail,
  Shield,
  Key,
  Database,
  Cpu,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  LogOut,
  Save
} from 'lucide-react';

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [autoSeek, setAutoSeek] = useState(
    localStorage.getItem('yt_auto_seek') !== 'false'
  );
  const [modelTemp, setModelTemp] = useState('balanced');

  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem('yt_auto_seek', autoSeek.toString());
    localStorage.setItem('yt_model_temp', modelTemp);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClearCache = () => {
    if (window.confirm('Clear all locally cached video selections and preferences? This will not delete your account data on the server.')) {
      localStorage.removeItem('active_video_id');
      localStorage.removeItem('active_video_title');
      localStorage.removeItem('active_video_url');
      alert('Local session cache cleared successfully.');
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b0d11]">
      <Navbar 
        title="Settings & Preferences" 
        subtitle="Manage your profile, AI parameters, and vector database status" 
      />

      <div className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-8 pb-16">
        {saveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>Preferences saved successfully.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: User Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#121620] border border-[#232b3b] rounded-2xl p-6 text-center space-y-4 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-amber-500 text-white font-bold text-2xl flex items-center justify-center mx-auto ring-4 ring-brand-500/20 shadow-xl shadow-brand-500/20">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {user?.full_name || 'Active Learner'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
              </div>

              <div className="pt-3 border-t border-[#1e2533] flex items-center justify-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  PRO Plan
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active
                </span>
              </div>

              <button
                onClick={logout}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* Infrastructure Health Status */}
            <div className="bg-[#121620] border border-[#232b3b] rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-400" />
                RAG Engine Status
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-[#0e1219] rounded-lg border border-[#1e2533]">
                  <span className="text-gray-400">LLM Provider</span>
                  <span className="text-white font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Groq (Llama-3.3-70B)
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#0e1219] rounded-lg border border-[#1e2533]">
                  <span className="text-gray-400">Vector Store</span>
                  <span className="text-white font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Qdrant Cloud
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#0e1219] rounded-lg border border-[#1e2533]">
                  <span className="text-gray-400">Embeddings</span>
                  <span className="text-white font-medium">all-MiniLM-L6-v2 (384d)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#0e1219] rounded-lg border border-[#1e2533]">
                  <span className="text-gray-400">Database</span>
                  <span className="text-white font-medium">PostgreSQL / SQLite</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Preferences & Security */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Details Form */}
            <div className="bg-[#121620] border border-[#232b3b] rounded-2xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-[#1e2533]">
                <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Profile Information</h3>
                  <p className="text-xs text-gray-400">Your registered account credentials</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    readOnly
                    value={user?.full_name || 'Learner'}
                    className="w-full bg-[#0e1219] border border-[#232b3b] text-gray-300 rounded-xl px-3.5 py-2.5 text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    readOnly
                    value={user?.email || ''}
                    className="w-full bg-[#0e1219] border border-[#232b3b] text-gray-300 rounded-xl px-3.5 py-2.5 text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* AI & Interactive Playback Preferences */}
            <form onSubmit={handleSavePreferences} className="bg-[#121620] border border-[#232b3b] rounded-2xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-[#1e2533]">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI & Playback Configuration</h3>
                  <p className="text-xs text-gray-400">Customize how RAG answers and timestamps operate</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-[#0e1219] rounded-xl border border-[#1e2533]">
                  <div>
                    <h4 className="text-sm font-medium text-white">Auto-Seek YouTube Video on Citation Click</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      When you click a [mm:ss] timestamp badge in chat, jump the video player automatically.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSeek}
                    onChange={(e) => setAutoSeek(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-700 bg-gray-900 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 bg-[#0e1219] rounded-xl border border-[#1e2533] space-y-2">
                  <label className="block text-sm font-medium text-white">
                    RAG Response Creativity Profile
                  </label>
                  <p className="text-xs text-gray-400">
                    Controls LLM temperature. Grounded enforces strict adherence to video transcript chunks.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    {[
                      { id: 'strict', label: 'Strictly Grounded', desc: 'Temp 0.1 • Zero Hallucination' },
                      { id: 'balanced', label: 'Balanced', desc: 'Temp 0.2 • Natural & Accurate' },
                      { id: 'creative', label: 'Detailed Educator', desc: 'Temp 0.4 • Expanded Context' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setModelTemp(mode.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          modelTemp === mode.id
                            ? 'border-brand-500 bg-brand-500/10 text-white shadow-sm'
                            : 'border-[#232b3b] bg-[#0e1219] text-gray-400 hover:border-gray-700'
                        }`}
                      >
                        <div className="text-xs font-semibold">{mode.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-500/25"
                >
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            </form>

            {/* Storage & Local Cache */}
            <div className="bg-[#121620] border border-[#232b3b] rounded-2xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-[#1e2533]">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Client Session Cache</h3>
                  <p className="text-xs text-gray-400">Clear temporary workspace state</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 bg-[#0e1219] rounded-xl border border-[#1e2533]">
                <div>
                  <div className="text-sm font-medium text-white">Clear Active Video & Workspace Cache</div>
                  <div className="text-xs text-gray-400">
                    Resets the current browser tab's active video selection and unmounts cached video player references.
                  </div>
                </div>
                <button
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-[#1b2230] hover:bg-[#232c3e] text-gray-200 border border-[#2b364c] rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Clear Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
