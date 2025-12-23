
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, BarChart, RotateCcw, Home, Award } from 'lucide-react';
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

  const scoreColor = result.percentage >= 70 ? 'text-emerald-500' : result.percentage >= 40 ? 'text-indigo-500' : 'text-rose-500';

  return (
    <div className="max-w-xl mx-auto space-y-8 py-8 animate-fadeIn">
      <div className="text-center space-y-4">
        <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 border-4 ${scoreColor.replace('text', 'border')}`}>
          <Award size={48} className={scoreColor} />
        </div>
        <h1 className="text-3xl font-bold">Test Completed!</h1>
        <p className="text-gray-500">You've successfully completed the {result.chapterName} assessment.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <div className="text-5xl font-bold mb-2">{result.percentage}%</div>
          <div className="text-indigo-100 font-medium uppercase tracking-widest text-sm">Overall Score</div>
        </div>
        
        <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700 border-b border-gray-100 dark:border-gray-700">
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
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600">
              <BarChart size={20} />
            </div>
            <div>
              <div className="text-sm font-bold">{result.totalQuestions}</div>
              <div className="text-[10px] text-gray-500 uppercase">Total Questions</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600">
              <CheckCircle2 size={20} />
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
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30"
        >
            <RotateCcw size={20} /> Retake Test
        </Link>
        <Link 
            to="/"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
        >
            <Home size={20} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default SummaryView;
