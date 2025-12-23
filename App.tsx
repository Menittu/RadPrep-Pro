
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Home, BookOpen, Search, BarChart2, Settings, Download, Trash2, Bookmark } from 'lucide-react';
import HomeView from './views/HomeView';
import TestRoomView from './views/TestRoomView';
import ChapterManager from './views/ChapterManager';
import SearchView from './views/SearchView';
import AnalyticsView from './views/AnalyticsView';
import SummaryView from './views/SummaryView';
import { db } from './db';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chapters, setChapters] = useState<string[]>([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

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
      <div className={`min-h-screen flex flex-col ${darkMode ? 'dark text-gray-100 bg-gray-900' : 'bg-gray-50 text-gray-900'}`}>
        
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between md:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Menu size={24} />
            </button>
            <Link to="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">RadPrep Pro</Link>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Sidebar Backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={closeSidebar}></div>
        )}

        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
            <h2 className="font-bold text-lg">Menu</h2>
            <button onClick={closeSidebar} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
          </div>
          <nav className="p-4 space-y-2">
            <SidebarItem icon={<Home size={20}/>} label="Dashboard" to="/" onClick={closeSidebar} />
            <SidebarItem icon={<Search size={20}/>} label="Search MCQs" to="/search" onClick={closeSidebar} />
            <SidebarItem icon={<BarChart2 size={20}/>} label="Analytics" to="/analytics" onClick={closeSidebar} />
            <SidebarItem icon={<Settings size={20}/>} label="Chapters" to="/manage" onClick={closeSidebar} />
            
            <div className="pt-4 mt-4 border-t dark:border-gray-700">
              <p className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chapters</p>
              {chapters.length === 0 ? (
                <p className="px-3 text-sm text-gray-400 italic">No chapters imported</p>
              ) : (
                chapters.map(ch => (
                  <SidebarItem key={ch} icon={<BookOpen size={18}/>} label={ch} to={`/test-config/${encodeURIComponent(ch)}`} onClick={closeSidebar} />
                ))
              )}
            </div>
          </nav>
        </aside>

        <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
          <Routes>
            <Route path="/" element={<HomeView />} />
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
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
};

export default App;
