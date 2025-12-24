import React, { useState, useEffect } from 'react';
import { Search, Bookmark, CheckCircle } from 'lucide-react';
import { db } from '../db';
import { Question } from '../types';

const SearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Question[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      const items = await db.searchQuestions(query);
      setResults(items);
      setSearching(false);
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Search keywords (e.g. 'Absorbed Dose', 'ICRP')..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-full bg-white dark:bg-[#191C1C] border border-[#DAE4E4] dark:border-[#3F4948] focus:ring-2 focus:ring-[#00696B] outline-none shadow-sm transition-all"
        />
      </div>

      <div className="space-y-4">
        {results.map(q => (
          <div key={q.id} className="bg-white dark:bg-[#191C1C] p-6 rounded-[28px] border border-[#DAE4E4] dark:border-[#3F4948] shadow-sm animate-fadeIn">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00696B] bg-[#9CF1F3] dark:bg-[#3F4948] px-3 py-1 rounded-full">
                {q.chapter}
              </span>
              {q.isBookmarked && <Bookmark size={16} className="text-amber-500 fill-current" />}
            </div>
            <h4 className="text-lg font-medium leading-relaxed mb-4">{q.text}</h4>
            <div className="p-4 bg-gray-50 dark:bg-[#0E1414] rounded-2xl border border-[#DAE4E4] dark:border-[#3F4948]">
               <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                 <CheckCircle size={14} /> Correct: {q.options[q.correctIndex]}
               </div>
               <p className="text-sm text-[#3F4948] dark:text-[#BEC8C8] italic">
                 {q.explanation}
               </p>
            </div>
          </div>
        ))}

        {query.length >= 2 && results.length === 0 && !searching && (
          <div className="text-center py-12 text-gray-500">
            No questions found for "{query}"
          </div>
        )}

        {query.length < 2 && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-[#191C1C] rounded-full flex items-center justify-center text-gray-400 mb-4">
              <Search size={32} />
            </div>
            <p className="text-gray-500">Enter keywords to search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;