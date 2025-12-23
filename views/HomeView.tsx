
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircle, Clock, CheckCircle, Target, BrainCircuit, Activity, BookOpen, GraduationCap, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
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
  }, []);

  const startTest = async (mode: TestMode) => {
    if (!chapter) return;
    const questions = await db.questions.where('chapter_name').equals(chapter).toArray();
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

  const resumeTest = () => {
    navigate('/test');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-indigo-200 dark:bg-indigo-900 rounded-full"></div>
        <p className="text-gray-400 font-medium">Syncing Data...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-[80px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-4 border border-indigo-500/30">
              <Sparkles size={14} /> EXAM PREP SUITE
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              RadPrep Pro
            </h1>
            <p className="text-gray-400 text-lg mb-8 font-medium leading-relaxed">
              Your comprehensive toolkit for Radiotherapy recruitment success. Chapter-wise analysis & deep explanations.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <StatCard icon={<BrainCircuit size={18}/>} label="MCQs" value={stats.totalQ.toLocaleString()} />
              <StatCard icon={<Activity size={18}/>} label="Chapters" value={stats.chapters.toLocaleString()} />
              <StatCard icon={<TrendingUp size={18}/>} label="Accuracy" value={`${stats.lastScore}%`} />
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white/5 p-8 rounded-[3rem] backdrop-blur-xl border border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
               <GraduationCap size={140} className="text-indigo-400 opacity-90" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Persistence/Resume Alert */}
      {activeSession && !activeSession.isCompleted && (
        <div className="group relative overflow-hidden bg-gradient-to-br from-amber-400 to-orange-500 p-1 rounded-[2rem] shadow-xl shadow-amber-500/20 hover:scale-[1.01] transition-all">
          <div className="bg-white dark:bg-slate-900 rounded-[1.9rem] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center text-amber-600">
                <Clock size={28} className="animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-black text-xl text-slate-800 dark:text-white mb-0.5">Test in Progress</h3>
                <p className="text-slate-500 dark:text-gray-400 font-medium">
                  Resume: <span className="text-amber-600 font-bold">{activeSession.chapterName}</span>
                </p>
              </div>
            </div>
            <button 
              onClick={resumeTest}
              className="w-full md:w-auto px-10 py-4 bg-amber-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-amber-500/30 hover:bg-amber-600 flex items-center justify-center gap-3"
            >
              Continue Test <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Content Section */}
      {chapter ? (
        <div className="space-y-6 animate-slideUp">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-3 bg-indigo-600 rounded-full"></div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 dark:text-white">Start Session</h2>
                <p className="text-gray-500 font-medium">Focused on: {chapter}</p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <ModeCard 
              title="Practice" 
              desc="Instant feedback and in-depth logic for every question. Ideal for initial learning." 
              icon={<PlayCircle size={36} className="text-emerald-500" />}
              accentColor="emerald"
              onClick={() => startTest(TestMode.PRACTICE)}
            />
            <ModeCard 
              title="Mock Exam" 
              desc="Timed pressure. No feedback until submission. Perfect for testing exam readiness." 
              icon={<Target size={36} className="text-rose-500" />}
              accentColor="rose"
              onClick={() => startTest(TestMode.MOCK)}
            />
          </div>
        </div>
      ) : (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative p-20 text-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[3rem] bg-white dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="mx-auto w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500 mb-8 shadow-inner">
              <BookOpen size={48} strokeWidth={1.5} />
            </div>
            <h3 className="text-3xl font-black text-slate-400 dark:text-slate-600 mb-3 tracking-tight">Select Chapter</h3>
            <p className="text-slate-400 dark:text-slate-500 font-medium max-w-xs mx-auto">
              Pick a radiotherapy chapter from the sidebar menu to begin your mastery journey.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-default">
    <div className="text-indigo-400">{icon}</div>
    <div>
      <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300 leading-none mb-1">{label}</div>
      <div className="text-xl font-bold leading-none">{value}</div>
    </div>
  </div>
);

const ModeCard = ({ title, desc, icon, onClick, accentColor }: { title: string, desc: string, icon: React.ReactNode, onClick: () => void, accentColor: string }) => {
  const accentClasses = {
    emerald: "hover:border-emerald-500/50 shadow-emerald-500/5",
    rose: "hover:border-rose-500/50 shadow-rose-500/5",
  }[accentColor] || "hover:border-indigo-500/50";

  return (
    <button 
      onClick={onClick}
      className={`group text-left p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-transparent transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col h-full ${accentClasses} shadow-sm border-gray-100 dark:border-slate-800`}
    >
      <div className="mb-8 bg-slate-50 dark:bg-slate-800/50 w-20 h-20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
        {icon}
      </div>
      <h3 className="text-3xl font-black mb-4 text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{title}</h3>
      <p className="text-gray-500 dark:text-slate-400 font-medium leading-relaxed flex-grow">{desc}</p>
      <div className="mt-8 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase text-sm tracking-wider">
        Start Now <ArrowRight size={18} />
      </div>
    </button>
  );
};

export default HomeView;
