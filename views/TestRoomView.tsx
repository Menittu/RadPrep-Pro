import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Bookmark, Info } from 'lucide-react';
import { db } from '../db';
import { Question, TestSession, TestMode } from '../types';

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

  // Sync progress with App header
  useEffect(() => {
    if (session) {
      window.dispatchEvent(new CustomEvent('testProgressUpdate', { 
        detail: { current: session.currentQuestionIndex + 1, total: session.questionIds.length } 
      }));
    }
  }, [session?.currentQuestionIndex, session?.questionIds.length]);

  const saveSessionToDB = async (updated: TestSession) => {
    setSession(updated);
    await db.saveActiveSession(updated);
  };

  if (loading || !session) return null;

  const currentIdx = session.currentQuestionIndex;
  const currentQ = questions[currentIdx];
  const total = questions.length;
  const selectedOption = session.selectedAnswers[currentQ.id];
  const showFeedback = session.mode === TestMode.PRACTICE && selectedOption !== undefined;

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prev = async () => {
    if (currentIdx > 0) {
      const updated = { ...session, currentQuestionIndex: currentIdx - 1 };
      await saveSessionToDB(updated);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleBookmark = async () => {
    await db.toggleBookmark(currentQ.id);
    const updatedQs = [...questions];
    updatedQs[currentIdx] = { ...currentQ, isBookmarked: !currentQ.isBookmarked };
    setQuestions(updatedQs);
  };

  const finishTest = async () => {
    if (!confirm("Submit test?")) return;
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
    <div className="flex flex-col space-y-6 pb-24 max-w-2xl mx-auto animate-fadeIn" ref={scrollRef}>
      
      {/* Sub-Header Actions */}
      <div className="flex items-center justify-between px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-[#00696B] dark:text-[#80D4D6] uppercase tracking-[0.2em] mb-0.5">Chapter</span>
          <span className="text-sm font-bold opacity-60 truncate max-w-[150px]">{session.chapterName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleBookmark} className={`p-3 rounded-full transition-m3 ${currentQ.isBookmarked ? 'bg-[#9CF1F3] text-[#00696B]' : 'bg-[#DAE4E4] dark:bg-[#3F4948]'}`}>
            <Bookmark size={20} fill={currentQ.isBookmarked ? 'currentColor' : 'none'} />
          </button>
          <button onClick={finishTest} className="bg-[#00696B] dark:bg-[#80D4D6] text-white dark:text-[#002021] px-6 py-2.5 rounded-full text-sm font-bold shadow-md">
            Finish
          </button>
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="bg-[#F4FBFA] dark:bg-[#191C1C] p-8 md:p-12 rounded-[32px] border border-[#DAE4E4] dark:border-[#3F4948] shadow-sm">
        <div className="mb-8">
           <span className="bg-[#00696B]/10 dark:bg-[#80D4D6]/10 text-[#00696B] dark:text-[#80D4D6] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
             MCQ {currentIdx + 1} / {total}
           </span>
           <h2 className="text-xl md:text-2xl font-bold mt-6 leading-tight text-[#191C1C] dark:text-[#E0E3E3]">
             {currentQ.text}
           </h2>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((option, idx) => {
            let stateStyle = "bg-[#F4FBFA] dark:bg-[#0E1414] border-[#DAE4E4] dark:border-[#3F4948] hover:border-[#00696B]";
            if (selectedOption === idx) {
               stateStyle = "border-[#00696B] dark:border-[#80D4D6] bg-[#9CF1F3] dark:bg-[#3F4948] shadow-inner";
            }
            if (showFeedback) {
              if (idx === currentQ.correctIndex) {
                stateStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
              } else if (selectedOption === idx) {
                stateStyle = "border-rose-500 bg-rose-50 dark:bg-rose-900/20";
              }
            }
            return (
              <button key={idx} onClick={() => handleSelect(idx)} className={`group w-full flex items-center gap-5 p-5 rounded-[20px] border-2 text-left transition-m3 active:scale-[0.98] ${stateStyle}`}>
                <span className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-m3 ${selectedOption === idx ? 'bg-[#00696B] border-[#00696B] text-white' : 'border-[#BEC8C8] text-[#3F4948]'}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm md:text-base font-medium text-[#191C1C] dark:text-[#E0E3E3]">{option}</span>
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div className="mt-10 animate-fadeIn">
            <div className="p-6 bg-[#F4FBFA] dark:bg-[#3F4948]/20 rounded-[28px] border border-[#DAE4E4] dark:border-[#3F4948]">
              <div className="flex items-center gap-2 mb-3 text-[#00696B] dark:text-[#80D4D6] font-bold text-sm">
                <Info size={18} /> Basic Insight
              </div>
              <p className="text-sm text-[#3F4948] dark:text-[#BEC8C8] italic leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* NAVIGATION CONTROLS */}
      <div className="flex items-center gap-4 px-2">
        <button onClick={prev} disabled={currentIdx === 0} className="flex-1 flex items-center justify-center gap-3 py-5 rounded-full bg-white dark:bg-[#191C1C] border border-[#DAE4E4] dark:border-[#3F4948] font-bold text-sm disabled:opacity-30 transition-m3 active:scale-95">
          <ChevronLeft size={20} /> Prev
        </button>
        <button onClick={next} disabled={currentIdx === total - 1} className="flex-1 flex items-center justify-center gap-3 py-5 rounded-full bg-[#00696B] dark:bg-[#80D4D6] text-white dark:text-[#002021] font-bold text-sm disabled:opacity-30 transition-m3 shadow-lg active:scale-95">
          Next <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default TestRoomView;