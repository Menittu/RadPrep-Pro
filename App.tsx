import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Home, BookOpen, Search, BarChart2, Settings, Sparkles } from 'lucide-react';
import HomeView from './views/HomeView';
import TestRoomView from './views/TestRoomView';
import ChapterManager from './views/ChapterManager';
import SearchView from './views/SearchView';
import AnalyticsView from './views/AnalyticsView';
import SummaryView from './views/SummaryView';
import AIGeneratorView from './views/AIGeneratorView';
import { db } from './db';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chapters, setChapters] = useState<string[]>([]);
  const [progress, setProgress] = useState<{current: number, total: number} | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleProgress = (e: any) => {
      setProgress(e.detail);
    };
    window.addEventListener('testProgressUpdate', handleProgress);
    return () => window.removeEventListener('testProgressUpdate', handleProgress);
  }, []);

  const loadChapters = async () => {
    const list = await db.getChapters();
    setChapters(list);
  };

  useEffect(() => {
    loadChapters();
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <HashRouter>
      <div className={`min-h-screen flex flex-col transition-m3`}>
        
        <header className="h-16 sticky top-0 z-50 bg-[#F4FBFA]/90 dark:bg-[#0E1414]/90 backdrop-blur-md px-4 flex flex-col justify-center border-b border-[#DAE4E4] dark:border-[#3F4948]">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="p-3 hover:bg-[#DAE4E4] dark:hover:bg-[#3F4948] rounded-full transition-m3">
                <Menu size={24} />
              </button>
              <Link to="/" className="text-xl font-semibold text-[#00696B] dark:text-[#80D4D6] tracking-tight">RadPrep Pro</Link>
            </div>
            <button onClick={() => setDarkMode(!darkMode)} className="p-3 hover:bg-[#DAE4E4] dark:hover:bg-[#3F4948] rounded-full transition-m3">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {progress && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-[#9CF1F3] dark:bg-[#3F4948]">
              <div 
                className="h-full bg-[#00696B] dark:bg-[#80D4D6] progress-bar-fill shadow-[0_0_8px_rgba(0,105,107,0.4)]"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          )}
        </header>

        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={closeSidebar}></div>
        )}

        <aside className={`fixed top-0 left-0 bottom-0 z-50 w-80 bg-[#F4FBFA] dark:bg-[#0E1414] shadow-2xl transform transition-transform duration-400 ease-[cubic-bezier(0.2,0,0,1)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} rounded-r-[28px]`}>
          <div className="h-16 px-6 flex items-center justify-between border-b dark:border-[#3F4948]">
            <h2 className="font-medium text-sm text-[#3F4948] dark:text-[#BEC8C8] uppercase tracking-wider">Menu</h2>
            <button onClick={closeSidebar} className="p-2 hover:bg-[#DAE4E4] dark:hover:bg-[#3F4948] rounded-full"><X size={20} /></button>
          </div>
          <nav className="p-4 space-y-1">
            <SidebarItem icon={<Home size={22}/>} label="Dashboard" to="/" onClick={closeSidebar} />
            <SidebarItem icon={<Sparkles size={22}/>} label="AI Research Lab" to="/ai-lab" onClick={closeSidebar} />
            <SidebarItem icon={<Search size={22}/>} label="Search Engine" to="/search" onClick={closeSidebar} />
            <SidebarItem icon={<BarChart2 size={22}/>} label="Analytics" to="/analytics" onClick={closeSidebar} />
            <SidebarItem icon={<Settings size={22}/>} label="Manage Chapters" to="/manage" onClick={closeSidebar} />
            
            <div className="pt-6 mt-6 border-t dark:border-[#3F4948]">
              <p className="px-4 mb-4 text-xs font-semibold text-[#00696B] dark:text-[#80D4D6] uppercase tracking-widest">Chapters</p>
              <div className="space-y-1 max-h-[45vh] overflow-y-auto no-scrollbar">
                {chapters.length === 0 ? (
                  <p className="px-4 text-sm text-gray-400 italic">No data found.</p>
                ) : (
                  chapters.map(ch => (
                    <SidebarItem key={ch} icon={<BookOpen size={20}/>} label={ch} to={`/test-config/${encodeURIComponent(ch)}`} onClick={closeSidebar} />
                  ))
                )}
              </div>
            </div>
          </nav>
        </aside>

        <main className="flex-1 container mx-auto px-4 py-6 md:py-10 max-w-4xl">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/ai-lab" element={<AIGeneratorView onImport={loadChapters} />} />
            <Route path="/search" element={<SearchView />} />
            <Route path="/analytics" element={<AnalyticsView />} />
            <Route path="/manage" element={<ChapterManager onUpdate={loadChapters} />} />
            <Route path="/test-config/:chapter" element={<HomeView />} />
            <Route path="/test" element={<TestRoomView />} />
            <Route path="/summary" element={<SummaryView />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode, label: string, to: string, onClick: () => void }> = ({ icon, label, to, onClick }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3 rounded-full transition-m3 ${active ? 'bg-[#9CF1F3] text-[#002021] dark:bg-[#3F4948] dark:text-[#9CF1F3]' : 'text-[#3F4948] dark:text-[#BEC8C8] hover:bg-[#DAE4E4] dark:hover:bg-[#3F4948]/50'}`}
    >
      <div className={active ? 'text-[#00696B] dark:text-[#80D4D6]' : ''}>{icon}</div>
      <span className="font-medium text-sm truncate">{label}</span>
    </Link>
  );
};

export default App;