
import React, { useState, useEffect } from 'react';
import { Upload, Download, Trash2, FileText, Plus, Database, AlertCircle, ShieldAlert, FileJson } from 'lucide-react';
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
      const count = await db.questions.where('chapter_name').equals(name).count();
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
        
        const chapterName = file.name.replace('.json', '');
        await db.addQuestions(chapterName, json);
        
        loadData();
        onUpdate();
        setLoading(false);
      } catch (err) {
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
    const qs = await db.questions.where('chapter_name').equals(name).toArray();
    const exportData = qs.map(({id, chapter_name, isBookmarked, ...rest}) => rest);
    downloadJson(exportData, `${name}_backup.json`);
  };

  const exportAllChapters = async () => {
    const qs = await db.questions.toArray();
    // For global export, we keep chapter names so they can be re-imported correctly if the system supports multi-chapter JSONs
    // Or users can just have a backup of everything.
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
          <Database className="text-indigo-600" size={32} /> Data Vault
        </h1>
        <div className="flex items-center gap-2">
           <button 
             onClick={exportAllChapters}
             disabled={chapters.length === 0}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50"
           >
             <FileJson size={18} /> Export All
           </button>
           <button 
             onClick={deleteAllChapters}
             disabled={chapters.length === 0}
             className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold rounded-xl hover:bg-rose-100 transition-all disabled:opacity-50"
           >
             <ShieldAlert size={18} /> Clear All
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Import Section */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Upload size={20} className="text-indigo-500" /> Import Chapter
            </h3>
            <p className="text-sm text-gray-500 mb-6">Upload your radiotherapy MCQs in JSON format. The file name will be used as the chapter name.</p>
            
            <input 
              type="file" 
              id="json-upload" 
              accept=".json" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <label 
              htmlFor="json-upload"
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white p-4 rounded-2xl font-bold cursor-pointer hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30"
            >
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

        {/* List Section */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold px-1">Active Chapters ({chapters.length})</h3>
          <div className="grid gap-4">
            {chapters.map(ch => (
              <div key={ch.name} className="group bg-white dark:bg-gray-800 p-5 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-gray-100">{ch.name}</h4>
                    <p className="text-sm text-gray-500 font-medium">{ch.count} Questions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => exportChapter(ch.name)}
                    className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all"
                    title="Export this Chapter"
                  >
                    <Download size={20} />
                  </button>
                  <button 
                    onClick={() => deleteChapter(ch.name)}
                    className="p-3 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all"
                    title="Delete Chapter"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}

            {chapters.length === 0 && (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
                <FileJson size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 font-medium italic">No chapters loaded in the vault.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterManager;
