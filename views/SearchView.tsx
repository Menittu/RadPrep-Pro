
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
          className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
        />
      </div>

      <div className="space-y-4">
        {results.map(q => (
          <div key={q.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm animate-fadeIn">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded">
                {q.chapter}
              </span>
              {q.isBookmarked && <Bookmark size={16} className="text-amber-500 fill-current" />}
            </div>
            <h4 className="text-lg font-medium leading-relaxed mb-4">{q.text}</h4>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800">
               <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                 <CheckCircle size={14} /> Correct Answer: {q.options[q.correctIndex]}
               </div>
               <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                 {q.explanation}
               </p>
            </div>
          </div>
        ))}

        {query.length >= 2 && results.length === 0 && !searching && (
          <div className="text-center py-12 text-gray-500">
            No questions found matching "{query}"
          </div>
        )}

        {query.length < 2 && (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <Search size={32} />
            </div>
            <p className="text-gray-500">Enter at least 2 characters to search across all chapters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;
