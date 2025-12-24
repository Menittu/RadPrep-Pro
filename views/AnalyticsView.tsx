import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Target, TrendingUp, Award, Clock } from 'lucide-react';
import { db } from '../db';
import { TestResult } from '../types';

const AnalyticsView: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [chapterStats, setChapterStats] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const allResults = await db.results.orderBy('date').reverse().toArray();
      setResults(allResults);

      const chapterGroups: Record<string, { total: number, correct: number, count: number }> = {};
      allResults.forEach(r => {
        if (!chapterGroups[r.chapterName]) {
          chapterGroups[r.chapterName] = { total: 0, correct: 0, count: 0 };
        }
        chapterGroups[r.chapterName].total += r.totalQuestions;
        chapterGroups[r.chapterName].correct += r.correct;
        chapterGroups[r.chapterName].count += 1;
      });

      const stats = Object.entries(chapterGroups).map(([name, data]) => ({
        name,
        accuracy: Math.round((data.correct / data.total) * 100),
        tests: data.count
      }));
      setChapterStats(stats);
    };
    load();
  }, []);

  const overallAccuracy = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length) 
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          icon={<Award className="text-amber-500" />} 
          label="Overall Accuracy" 
          value={`${overallAccuracy}%`} 
          sub="Average score"
        />
        <MetricCard 
          icon={<TrendingUp className="text-[#00696B]" />} 
          label="Total Sessions" 
          value={results.length.toString()} 
          sub="Completed tests"
        />
        <MetricCard 
          icon={<Clock className="text-emerald-500" />} 
          label="Last Test" 
          value={results[0] ? new Date(results[0].date).toLocaleDateString() : 'N/A'} 
          sub="Recent activity"
        />
      </div>

      <div className="bg-white dark:bg-[#191C1C] p-6 rounded-[28px] border border-[#DAE4E4] dark:border-[#3F4948] shadow-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Target className="text-[#00696B]" /> Chapter-wise Accuracy
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chapterStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#37415122" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="accuracy" radius={[8, 8, 0, 0]} barSize={40}>
                {chapterStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.accuracy > 70 ? '#10b981' : entry.accuracy > 40 ? '#00696B' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Recent History</h3>
        {results.map((res, i) => (
          <div key={i} className="bg-white dark:bg-[#191C1C] p-4 rounded-2xl flex items-center justify-between border border-[#DAE4E4] dark:border-[#3F4948] shadow-sm">
             <div>
                <h4 className="font-bold text-sm">{res.chapterName}</h4>
                <p className="text-xs text-[#3F4948] dark:text-[#BEC8C8]">{new Date(res.date).toLocaleString()} • {res.mode} Mode</p>
             </div>
             <div className={`px-4 py-1 rounded-full font-bold text-sm ${res.percentage > 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-[#9CF1F3] text-[#002021]'}`}>
                {res.percentage}%
             </div>
          </div>
        ))}
        {results.length === 0 && (
          <div className="text-center py-12 text-gray-400 italic bg-white dark:bg-[#191C1C] rounded-[28px] border border-dashed dark:border-[#3F4948]">
            Take your first test to see analytics!
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) => (
  <div className="bg-white dark:bg-[#191C1C] p-6 rounded-[28px] border border-[#DAE4E4] dark:border-[#3F4948] shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-3 bg-gray-50 dark:bg-[#0E1414] rounded-full">{icon}</div>
      <span className="text-sm font-bold text-[#3F4948] dark:text-[#BEC8C8] uppercase tracking-wider">{label}</span>
    </div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-xs text-gray-400">{sub}</div>
  </div>
);

export default AnalyticsView;