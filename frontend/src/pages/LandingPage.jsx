import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Sparkles, 
  Video, 
  Search, 
  BookOpen, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#0b0d11] text-[#e2e8f0] flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-[#1e2532] bg-[#0e1219]/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight flex items-center gap-1.5">
              LearnTube <span className="text-xs px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 font-bold uppercase">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-300 hover:text-white px-4 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 px-4 py-2 rounded-xl shadow-lg shadow-brand-500/25 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation YouTube RAG Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-[1.15]">
          Turn Any YouTube Lecture Into An <span className="bg-gradient-to-r from-brand-400 to-amber-400 bg-clip-text text-transparent">Interactive AI Tutor</span>
        </h1>

        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Ask questions and jump to the exact second in the lecture. Generate structured study guides, detailed multi-level summaries, and instant MCQ comprehension quizzes.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-xl shadow-brand-500/30 transition-all hover:-translate-y-0.5"
          >
            <span>Start Learning Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#181f2c] hover:bg-[#20293a] border border-[#2c374d] text-gray-200 font-semibold text-sm transition-all"
          >
            <span>Explore Demo</span>
          </Link>
        </div>

        {/* Core Pillars */}
        <div className="mt-24 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-[#121620] border border-[#232b3b] shadow-lg hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center mb-4">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Timestamped RAG</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Every answer is grounded in exact lecture transcripts with clickable citations jumping straight to the video second.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#121620] border border-[#232b3b] shadow-lg hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Study Guides</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Synthesize extensive, structured markdown study notes with formulas, conceptual breakdowns, and quick revision lists.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#121620] border border-[#232b3b] shadow-lg hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-4">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Interactive Quizzes</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Test your knowledge with 5-question AI-generated MCQs, immediate scoring, and deep educational explanations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#121620] border border-[#232b3b] shadow-lg hover:border-brand-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Instant Ingestion</h3>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Simply paste any YouTube link. The system extracts captions, chunks text, and vectorizes embeddings in seconds.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1e2532] bg-[#0c0f17] py-8 text-center text-xs text-gray-500">
        <p>© 2026 LearnTube AI. Production-Ready YouTube Lecture Assistant.</p>
      </footer>
    </div>
  );
};
