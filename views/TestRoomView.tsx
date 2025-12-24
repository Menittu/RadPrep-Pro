
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, Info, Send, Lightbulb, TrendingUp, Trophy } from 'lucide-react';
import { db } from '../db';
import { Question, TestSession, TestMode } from '../types';

const MOTIVATIONAL_MESSAGES = [
  { threshold: 10, text: "Off to a great start! 🚀" },
  { threshold: 25, text: "Consistency is key. Keep it up! 💎" },
  { threshold: 50, text: "Halfway there! You're doing amazing. 🌟" },
  { threshold: 75, text: "Almost finished! Push through! 💪" },
  { threshold: 90, text: "Nearly there! Perfect focus. 🎯" },
  { threshold: 100, text: "Victory lap! Last few questions. 🏆" }
];

const TestRoomView: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<TestSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    const activeSession = await db.getActiveSession();
    if (!activeSession) {
      navigate('/');
      return;
    }
    setSession(activeSession);

    const qs: Question[] = [];
    for (const id of activeSession.questionIds) {
      const q = await db.questions.get(id);
      if (q) qs.push(q);
    }
    setQuestions(qs);
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const saveSessionToDB = async (updated: TestSession) => {
    setSession(updated);
    await db.saveActiveSession(updated);
  };

  if (loading || !session) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-gray-400 font-bold animate-pulse">Synchronizing Session Integrity...</p>
    </div>
  );

  const currentIdx = session.currentQuestionIndex;
  const currentQ = questions[currentIdx];
  const total = questions.length;
  const progress = Math.round(((currentIdx + 1) / total) * 100);
  const selectedOption = session.selectedAnswers[currentQ.id];
  const showFeedback = session.mode === TestMode.PRACTICE && selectedOption !== undefined;

  const motivation = MOTIVATIONAL_MESSAGES.slice().reverse().find(m => progress >= m.threshold)?.text || "Focus & Precision";

  const handleSelect = async (idx: number) => {
    if (session.mode === TestMode.PRACTICE && selectedOption !== undefined) return;
    const updated = {
      ...session,
      selectedAnswers: { ...session.selectedAnswers, [currentQ.id]: idx }
    };
    await saveSessionToDB(updated);
  };

  const next = async () => {
    if (currentIdx < total - 1) {
      const updated = { ...session, currentQuestionIndex: currentIdx + 1 };
      await saveSessionToDB(updated);
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const prev = async () => {
    if (currentIdx > 0) {
      const updated = { ...session, currentQuestionIndex: currentIdx - 1 };
      await saveSessionToDB(updated);
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleBookmark = async () => {
    await db.toggleBookmark(currentQ.id);
    const updatedQs = [...questions];
    updatedQs[currentIdx] = { ...currentQ, isBookmarked: !currentQ.isBookmarked };
    setQuestions(updatedQs);
  };

  const finishTest = async () => {
    if (!session) return;
    if (!confirm("Are you sure you want to finalize this session and view results?")) return;
    
    let correctCount = 0;
    let attemptedCount = 0;
    
    questions.forEach(q => {
      const ans = session.selectedAnswers[q.id];
      if (ans !== undefined) {
        attemptedCount++;
        if (ans === q.correctIndex) correctCount++;
      }
    });

    const result = {
      date: Date.now(),
      chapterName: session.chapterName,
      mode: session.mode,
      totalQuestions: total,
      attempted: attemptedCount,
      correct: correctCount,
      wrong: attemptedCount - correctCount,
      percentage: total > 0 ? Math.round((correctCount / total) * 100) : 0
    };

    await db.results.add(result);
    localStorage.setItem('last_result', JSON.stringify(result));
    await db.clearActiveSession();
    navigate('/summary');
  };

  return (
    <div className="flex flex-col space-y-6 pb-20" ref={scrollRef}>
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 sticky top-20 z-30 transition-all">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/30">
              {currentIdx + 1}
            </div>
            <div className="max-w-[150px] sm:max-w-xs">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-0.5">ACTIVE CHAPTER</div>
              <div className="text-sm font-black text-slate-800 dark:text-white truncate">{session.chapterName}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleBookmark} className={`p-3.5 rounded-2xl transition-all ${currentQ.isBookmarked ? 'bg-amber-100 text-amber-600 shadow-md shadow-amber-500/10' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
              <Bookmark size={22} fill={currentQ.isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button onClick={finishTest} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
              <Send size={20} /> <span className="hidden sm:inline">Submit Test</span>
            </button>
          </div>
        </div>
        <div className="space-y-3">
          <div className="relative w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 bg-gradient-to-r from-indigo-500 to-violet-600 h-full transition-all duration-700 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{progress}% COMPLETE</span>
              </div>
              <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                <Trophy size={14} className="text-amber-500" />
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wider italic">{motivation}</span>
              </div>
          </div>
        </div>
      </div>

      <div className="animate-slideUp">
        <div className="bg-white dark:bg-slate-900 p-8 md:p-14 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 text-indigo-500/5 pointer-events-none select-none">
            <Lightbulb size={300} strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="mb-10">
               <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black tracking-widest uppercase border border-indigo-100 dark:border-indigo-800">
                 Question {currentIdx + 1}
               </span>
               <h2 className="text-2xl md:text-4xl font-bold leading-tight mt-6 text-slate-800 dark:text-white">
                 {currentQ.text}
               </h2>
            </div>
            <div className="grid gap-5">
              {currentQ.options.map((option, idx) => {
                let stateStyle = "border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-slate-50/40 dark:bg-slate-800/20";
                if (selectedOption === idx) {
                   stateStyle = "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/40 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg";
                }
                if (showFeedback) {
                  if (idx === currentQ.correctIndex) {
                    stateStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-400 ring-4 ring-emerald-500/10 shadow-lg shadow-emerald-500/10 scale-[1.02]";
                  } else if (selectedOption === idx) {
                    stateStyle = "border-rose-500 bg-rose-50 dark:bg-rose-900/30 dark:border-rose-400 ring-4 ring-rose-500/10 shadow-lg shadow-rose-500/10";
                  }
                }
                return (
                  <button key={idx} onClick={() => handleSelect(idx)} className={`group w-full flex items-start gap-6 p-6 md:p-8 rounded-[2rem] border-2 text-left transition-all duration-300 transform active:scale-[0.98] ${stateStyle}`}>
                    <span className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl border-2 transition-all ${selectedOption === idx ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xl md:text-2xl font-medium pt-2 leading-relaxed text-slate-700 dark:text-slate-200">{option}</span>
                  </button>
                );
              })}
            </div>
            {showFeedback && (
              <div className="mt-14 p-10 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800/50 animate-fadeIn relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6 text-indigo-700 dark:text-indigo-300 font-black text-xl uppercase tracking-widest">
                    <Info size={28} /> Explanation
                  </div>
                  <div className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {currentQ.explanation}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 mt-10">
          <button onClick={prev} disabled={currentIdx === 0} className="flex-1 flex items-center justify-center gap-3 py-6 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 font-black text-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xl active:scale-95">
            <ChevronLeft size={28} /> Prev
          </button>
          <button onClick={next} disabled={currentIdx === total - 1} className="flex-1 flex items-center justify-center gap-3 py-6 rounded-[2rem] bg-indigo-600 text-white font-black text-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/30 active:scale-95">
            Next <ChevronRight size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestRoomView;
