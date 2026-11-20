import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  HelpCircle, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Award, 
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Check
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { api } from '../services/api';

export const QuizPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const videoIdParam = searchParams.get('video_id');

  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  // Fetch quiz
  useEffect(() => {
    if (!selectedVideo) return;
    const fetchQuiz = async () => {
      setQuiz(null);
      setResults(null);
      setAnswers({});
      setCurrentIndex(0);
      try {
        const data = await api.quizzes.get(selectedVideo.id);
        setQuiz(data);
      } catch (err) {
        // Not generated yet
      }
    };
    fetchQuiz();
  }, [selectedVideo]);

  const handleGenerateQuiz = async () => {
    if (!selectedVideo || loading) return;
    setLoading(true);
    setResults(null);
    setAnswers({});
    setCurrentIndex(0);
    try {
      const data = await api.quizzes.generate(selectedVideo.id);
      setQuiz(data);
    } catch (err) {
      alert(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId, optionIdx) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    try {
      const resultData = await api.quizzes.submit(quiz.id, answers);
      setResults(resultData);
    } catch (err) {
      alert(err.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const currentQ = quiz?.questions ? quiz.questions[currentIndex] : null;
  const answeredCount = Object.keys(answers).length;
  const totalQ = quiz?.questions?.length || 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar
        title="Lecture Quiz & Knowledge Check"
        subtitle="Test your comprehension with 5-question AI-generated MCQs and instant grading"
        selectedVideo={selectedVideo}
        onSelectVideoChange={(vid) => {
          setSelectedVideo(vid);
          setSearchParams({ video_id: vid.id });
        }}
        videos={videos}
      />

      <main className="p-6 max-w-4xl mx-auto w-full space-y-6 flex-1">
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
        ) : !quiz ? (
          <div className="p-12 text-center rounded-2xl bg-[#121620] border border-[#232b3b] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Generate Quiz for "{selectedVideo.title}"</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                Generates a challenging 5-question multiple choice test based on the technical concepts taught in this lecture.
              </p>
            </div>
            <button
              onClick={handleGenerateQuiz}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating MCQs...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Lecture Quiz</span>
                </>
              )}
            </button>
          </div>
        ) : results ? (
          /* Quiz Results Screen */
          <div className="space-y-6">
            <div className="p-8 rounded-2xl bg-gradient-to-b from-[#161c28] to-[#121620] border border-[#273244] text-center shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/15 text-brand-400 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Quiz Completed!</h2>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div>
                  <p className="text-3xl font-black text-white">{results.score} / {results.total_questions}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Correct Answers</p>
                </div>
                <div className="w-px h-10 bg-[#252f40]" />
                <div>
                  <p className={`text-3xl font-black ${results.percentage >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {results.percentage}%
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Score</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => {
                    setResults(null);
                    setAnswers({});
                    setCurrentIndex(0);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#1c2332] hover:bg-[#232c3f] border border-[#2f3b52] text-xs font-semibold text-gray-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake This Quiz</span>
                </button>
              </div>
            </div>

            {/* Questions Review */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Detailed Answer Explanations</h3>
              {results.review.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl bg-[#121620] border ${
                    item.is_correct ? 'border-emerald-500/30' : 'border-red-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-sm font-bold text-white">
                      {idx + 1}. {item.question_text}
                    </h4>
                    {item.is_correct ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 text-[11px] font-bold shrink-0">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {item.options.map((opt, optIdx) => {
                      const isCorrect = optIdx === item.correct_index;
                      const isSelected = optIdx === item.selected_index;
                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 font-medium'
                              : isSelected
                              ? 'bg-red-500/10 border-red-500/40 text-red-200 font-medium'
                              : 'bg-[#161c28] border-[#252f40] text-gray-400'
                          }`}
                        >
                          <span>{opt}</span>
                          {isCorrect && <Check className="w-4 h-4 text-emerald-400" />}
                          {!isCorrect && isSelected && <XCircle className="w-4 h-4 text-red-400" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3.5 rounded-xl bg-[#171e2c] border border-[#252f40] text-xs text-gray-300">
                    <span className="font-bold text-brand-400">Explanation: </span>
                    {item.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active Quiz Taker Screen */
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="p-4 rounded-xl bg-[#121620] border border-[#232b3b] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white">
                  Question {currentIndex + 1} of {totalQ}
                </span>
                <span className="text-xs text-gray-400 ml-2">({answeredCount} of {totalQ} answered)</span>
              </div>
              <div className="w-36 h-2 rounded-full bg-[#1c2332] overflow-hidden">
                <div
                  className="h-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${(answeredCount / totalQ) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            {currentQ && (
              <div className="p-8 rounded-2xl bg-[#121620] border border-[#232b3b] shadow-xl space-y-6">
                <h3 className="text-base font-bold text-white leading-relaxed">
                  {currentIndex + 1}. {currentQ.question_text}
                </h3>

                <div className="space-y-3">
                  {currentQ.options.map((option, optIdx) => {
                    const isSelected = answers[currentQ.id] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(currentQ.id, optIdx)}
                        className={`w-full p-4 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-brand-500/15 border-brand-500 text-white shadow-md'
                            : 'bg-[#161c28] border-[#252f40] text-gray-300 hover:border-[#38465e]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                              isSelected
                                ? 'bg-brand-500 text-white'
                                : 'bg-[#202939] text-gray-400'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{option}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-brand-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="pt-4 border-t border-[#222a3a] flex items-center justify-between">
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-xl bg-[#181f2c] hover:bg-[#20293a] disabled:opacity-40 border border-[#2b3648] text-xs font-semibold text-gray-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  {currentIndex < totalQ - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1))}
                      className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={submitting || answeredCount === 0}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      {submitting ? 'Submitting & Grading...' : 'Submit Final Answers'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
