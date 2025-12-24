import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, RotateCcw, Home, Award } from 'lucide-react';
import { TestResult } from '../types';

const SummaryView: React.FC = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const last = localStorage.getItem('last_result');
    if (last) {
      setResult(JSON.parse(last));
    } else {
      navigate('/');
    }
  }, [navigate]);

  if (!result) return null;

  const scoreColor = result.percentage >= 70 ? 'text-emerald-500' : result.percentage >= 40 ? 'text-[#00696B]' : 'text-rose-500';

  return (
    <div className="max-w-xl mx-auto space-y-8 py-8 animate-fadeIn">
      <div className="text-center space-y-4">
        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-gray-50 dark:bg-[#191C1C] border-4 ${scoreColor.replace('text', 'border')}`}>
          <Award size={48} className={scoreColor} />
        </div>
        <h1 className="text-3xl font-bold">Test Completed!</h1>
        <p className="text-gray-500">Assessment of {result.chapterName} finished.</p>
      </div>

      <div className="bg-white dark:bg-[#191C1C] rounded-[32px] shadow-xl overflow-hidden border border-[#DAE4E4] dark:border-[#3F4948]">
        <div className="bg-[#00696B] p-8 text-center text-white">
          <div className="text-5xl font-bold mb-2">{result.percentage}%</div>
          <div className="text-[#9CF1F3] font-medium uppercase tracking-widest text-sm">Overall Score</div>
        </div>
        
        <div className="grid grid-cols-2 divide-x divide-[#DAE4E4] dark:divide-[#3F4948] border-b border-[#DAE4E4] dark:border-[#3F4948]">
          <div className="p-6 text-center">
            <div className="text-2xl font-bold text-emerald-500">{result.correct}</div>
            <div className="text-xs font-bold text-gray-400 uppercase">Correct</div>
          </div>
          <div className="p-6 text-center">
            <div className="text-2xl font-bold text-rose-500">{result.wrong}</div>
            <div className="text-xs font-bold text-gray-400 uppercase">Wrong</div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#9CF1F3] dark:bg-[#3F4948] rounded-full flex items-center justify-center text-[#00696B]">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="text-sm font-bold">{result.totalQuestions}</div>
              <div className="text-[10px] text-gray-500 uppercase">Total Items</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#9CF1F3] dark:bg-[#3F4948] rounded-full flex items-center justify-center text-[#00696B]">
              <RotateCcw size={20} />
            </div>
            <div>
              <div className="text-sm font-bold">{result.attempted}</div>
              <div className="text-[10px] text-gray-500 uppercase">Attempted</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <Link 
            to={`/test-config/${encodeURIComponent(result.chapterName)}`}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-[#00696B] text-white font-bold hover:scale-[1.02] transition-all shadow-xl shadow-[#00696B]/30"
        >
            <RotateCcw size={20} /> Retake Test
        </Link>
        <Link 
            to="/"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-white dark:bg-[#191C1C] border border-[#DAE4E4] dark:border-[#3F4948] font-bold hover:bg-gray-50 dark:hover:bg-[#3F4948] transition-all shadow-sm"
        >
            <Home size={20} /> Home
        </Link>
      </div>
    </div>
  );
};

export default SummaryView;