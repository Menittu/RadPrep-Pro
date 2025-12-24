import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircle, Clock, Target, BrainCircuit, Activity, BookOpen, GraduationCap, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { db } from '../db';
import { TestMode, TestSession } from '../types';

const HomeView: React.FC = () => {
  const { chapter } = useParams<{ chapter: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalQ: 0, chapters: 0, completedTests: 0, lastScore: 0 });
  const [activeSession, setActiveSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const allQ = await db.questions.count();
      const chaptersList = await db.getChapters();
      const results = await db.results.orderBy('date').reverse().toArray();
      const session = await db.getActiveSession();
      setActiveSession(session);

      setStats({ 
        totalQ: allQ, 
        chapters: chaptersList.length, 
        completedTests: results.length,
        lastScore: results.length > 0 ? results[0].percentage : 0
      });
      setLoading(false);
    };
    load();
    // Clear progress on home load
    window.dispatchEvent(new CustomEvent('testProgressUpdate', { detail: null }));
  }, []);

  const startTest = async (mode: TestMode) => {
    if (!chapter) return;
    const questions = await db.questions.where('chapter').equals(chapter).toArray();
    if (questions.length === 0) return;

    const session: TestSession = {
      chapterName: chapter,
      mode,
      currentQuestionIndex: 0,
      selectedAnswers: {},
      startTime: Date.now(),
      isCompleted: false,
      questionIds: questions.map(q => q.id)
    };

    await db.saveActiveSession(session);
    navigate('/test');
  };

  const resumeTest = () => navigate('/test');

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-[#00696B]/20 rounded-full"></div>
        <p className="text-[#00696B] font-medium">Syncing...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="relative overflow-hidden bg-[#00696B] dark:bg-[#3F4948] rounded-[28px] p-8 md:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold mb-6 backdrop-blur-md">
              <Sparkles size={14} /> EXAM PREP SUITE
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">RadPrep Pro</h1>
            <p className="text-white/80 text-lg mb-8 font-medium">Radiotherapy recruitment mastery toolkit. Conceptual depth for clinical success.</p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <StatCard label="MCQs" value={stats.totalQ.toLocaleString()} />
              <StatCard label="Chapters" value={stats.chapters.toLocaleString()} />
              <StatCard label="Accuracy" value={`${stats.lastScore}%`} />
            </div>
          </div>
          <div className="hidden lg:block bg-white/10 p-10 rounded-[40px] border border-white/20">
             <GraduationCap size={120} className="text-white/90" />
          </div>
        </div>
      </div>

      {activeSession && !activeSession.isCompleted && (
        <div className="bg-[#9CF1F3] dark:bg-[#3F4948] rounded-[28px] p-6 border-2 border-[#00696B]/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-white dark:bg-[#0E1414] rounded-full flex items-center justify-center text-[#00696B] dark:text-[#80D4D6] shadow-sm">
              <Clock size={32} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-[#002021] dark:text-[#9CF1F3]">Active Session</h3>
              <p className="text-[#3F4948] dark:text-[#BEC8C8] font-medium">Resume: <span className="text-[#00696B] dark:text-[#80D4D6] font-bold">{activeSession.chapterName}</span></p>
            </div>
          </div>
          <button onClick={resumeTest} className="w-full md:w-auto px-10 py-4 bg-[#00696B] dark:bg-[#80D4D6] text-white dark:text-[#002021] font-bold rounded-full transition-m3 hover:scale-105 flex items-center justify-center gap-3 shadow-lg">
            Continue <ArrowRight size={20} />
          </button>
        </div>
      )}

      {chapter ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <div className="h-8 w-2 bg-[#00696B] dark:bg-[#80D4D6] rounded-full"></div>
            <h2 className="text-2xl font-bold">Select Mode</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <ModeCard title="Practice" desc="Instant feedback. The laboratory for your learning." icon={<PlayCircle size={40} className="text-[#00696B]" />} onClick={() => startTest(TestMode.PRACTICE)} />
            <ModeCard title="Mock Exam" desc="Pressure testing. Blind analysis. Ready for the real challenge?" icon={<Target size={40} className="text-[#B3261E]" />} onClick={() => startTest(TestMode.MOCK)} />
          </div>
        </div>
      ) : (
        <div className="p-16 text-center border-2 border-dashed border-[#DAE4E4] dark:border-[#3F4948] rounded-[40px] bg-white/50 dark:bg-[#0E1414]/50">
          <BookOpen size={60} className="mx-auto text-[#00696B]/30 mb-6" />
          <h3 className="text-2xl font-bold text-gray-400 mb-2">Select a Chapter</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">Pick a topic from the navigation drawer to begin your professional journey.</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-white/10 px-6 py-2 rounded-full border border-white/20 backdrop-blur-sm">
    <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">{label}</div>
    <div className="text-lg font-bold">{value}</div>
  </div>
);

const ModeCard = ({ title, desc, icon, onClick }: { title: string, desc: string, icon: React.ReactNode, onClick: () => void }) => (
  <button onClick={onClick} className="group text-left p-10 bg-white dark:bg-[#191C1C] rounded-[28px] border border-[#DAE4E4] dark:border-[#3F4948] transition-m3 hover:border-[#00696B] hover:shadow-xl hover:-translate-y-1 flex flex-col h-full">
    <div className="mb-8 bg-[#F4FBFA] dark:bg-[#3F4948] w-20 h-20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-m3">
      {icon}
    </div>
    <h3 className="text-3xl font-bold mb-4 text-[#191C1C] dark:text-[#E0E3E3]">{title}</h3>
    <p className="text-[#3F4948] dark:text-[#BEC8C8] font-medium leading-relaxed flex-grow">{desc}</p>
    <div className="mt-8 flex items-center gap-2 text-[#00696B] dark:text-[#80D4D6] font-bold uppercase text-xs tracking-widest">
      Initialize <ArrowRight size={18} />
    </div>
  </button>
);

export default HomeView;