import React, { useState, useEffect } from 'react';
import { Upload, Download, Trash2, FileText, Database, AlertCircle, ShieldAlert, FileJson } from 'lucide-react';
import { db } from '../db';

interface ChapterManagerProps {
  onUpdate: () => void;
}

const ChapterManager: React.FC<ChapterManagerProps> = ({ onUpdate }) => {
  const [chapters, setChapters] = useState<{name: string, count: number}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    const list = await db.getChapters();
    const data = await Promise.all(list.map(async name => {
      const count = await db.questions.where('chapter').equals(name).count();
      return { name, count };
    }));
    setChapters(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json)) throw new Error("Format invalid. Root must be an array.");
        
        const fallbackChapterName = file.name.replace('.json', '');
        await db.addQuestions(fallbackChapterName, json);
        
        loadData();
        onUpdate();
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Error parsing JSON. Ensure it matches the required structure.");
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const deleteChapter = async (name: string) => {
    if (confirm(`Are you sure you want to delete chapter: ${name}?`)) {
      await db.deleteChapter(name);
      loadData();
      onUpdate();
    }
  };

  const deleteAllChapters = async () => {
    if (confirm("DANGER: This will delete ALL chapters and questions. This action cannot be undone. Proceed?")) {
      const list = await db.getChapters();
      for (const ch of list) {
        await db.deleteChapter(ch);
      }
      loadData();
      onUpdate();
    }
  };

  const exportChapter = async (name: string) => {
    const qs = await db.questions.where('chapter').equals(name).toArray();
    const exportData = qs.map(({id, isBookmarked, ...rest}) => rest);
    downloadJson(exportData, `${name}_backup.json`);
  };

  const exportAllChapters = async () => {
    const qs = await db.questions.toArray();
    const exportData = qs.map(({id, isBookmarked, ...rest}) => rest);
    downloadJson(exportData, `RadPrep_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
  };

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold flex items-center gap-3">
          <Database className="text-[#00696B]" size={32} /> Data Vault
        </h1>
        <div className="flex items-center gap-2">
           <button onClick={exportAllChapters} disabled={chapters.length === 0} className="flex items-center gap-2 px-4 py-2 bg-[#9CF1F3] dark:bg-[#3F4948]/30 text-[#00696B] dark:text-[#80D4D6] font-bold rounded-full hover:scale-105 transition-all disabled:opacity-50">
             <FileJson size={18} /> Export All
           </button>
           <button onClick={deleteAllChapters} disabled={chapters.length === 0} className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold rounded-full hover:scale-105 transition-all disabled:opacity-50">
             <ShieldAlert size={18} /> Clear All
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-[#191C1C] p-6 rounded-[28px] border border-[#DAE4E4] dark:border-[#3F4948] shadow-sm sticky top-24">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Upload size={20} className="text-[#00696B]" /> Import Chapter
            </h3>
            <p className="text-sm text-[#3F4948] dark:text-[#BEC8C8] mb-6">Upload radiotherapy MCQs in JSON format.</p>
            <input type="file" id="json-upload" accept=".json" onChange={handleFileUpload} className="hidden" />
            <label htmlFor="json-upload" className="w-full flex items-center justify-center gap-2 bg-[#00696B] text-white p-4 rounded-full font-bold cursor-pointer hover:bg-[#005254] transition-all shadow-lg shadow-[#00696B]/30">
              {loading ? 'Processing...' : 'Select JSON File'}
            </label>
            {error && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl flex items-start gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold px-1">Active Chapters ({chapters.length})</h3>
          <div className="grid gap-4">
            {chapters.map(ch => (
              <div key={ch.name} className="group bg-white dark:bg-[#191C1C] p-5 rounded-[28px] flex items-center justify-between shadow-sm border border-[#DAE4E4] dark:border-[#3F4948] hover:border-[#00696B] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#9CF1F3] dark:bg-[#3F4948]/30 text-[#00696B] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#191C1C] dark:text-[#E0E3E3]">{ch.name}</h4>
                    <p className="text-sm text-gray-500 font-medium">{ch.count} Questions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => exportChapter(ch.name)} className="p-3 text-gray-400 hover:text-[#00696B] hover:bg-[#9CF1F3] dark:hover:bg-[#3F4948] rounded-full transition-all">
                    <Download size={20} />
                  </button>
                  <button onClick={() => deleteChapter(ch.name)} className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-full transition-all">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
            {chapters.length === 0 && (
              <div className="text-center py-20 bg-gray-50 dark:bg-[#0E1414] border-2 border-dashed border-[#DAE4E4] dark:border-[#3F4948] rounded-[32px]">
                <FileJson size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 font-medium italic">No chapters loaded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterManager;