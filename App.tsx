import React, { useState, useEffect } from 'react';
import { Plus, LayoutDashboard, BarChart3, BrainCircuit, Loader2, Moon, Sun } from 'lucide-react';
import { Habit, HabitCategory, HabitType, InsightResponse } from './types';
import HabitCard from './components/HabitCard';
import AddHabitModal from './components/AddHabitModal';
import Analytics from './components/Analytics';
import { getHabitInsights } from './services/geminiService';

const App: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics'>('dashboard');
  const [aiInsight, setAiInsight] = useState<InsightResponse | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('habitflow_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('habitflow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('habitflow_theme', 'light');
    }
  }, [isDarkMode]);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('habitflow_data');
    if (saved) {
      setHabits(JSON.parse(saved));
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('habitflow_data', JSON.stringify(habits));
  }, [habits]);

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleSaveHabit = (data: { name: string; category: HabitCategory; type: HabitType; goal: number; unit: string }) => {
    if (editingHabit) {
      // Update existing habit
      setHabits(prevHabits => prevHabits.map(h => 
        h.id === editingHabit.id 
          ? { ...h, ...data } 
          : h
      ));
    } else {
      // Create new habit
      const newHabit: Habit = {
        id: generateId(),
        ...data,
        logs: {},
        createdAt: new Date().toISOString(),
        streak: 0
      };
      setHabits(prev => [...prev, newHabit]);
    }
    setIsModalOpen(false);
    setEditingHabit(null);
  };

  const handleAddClick = () => {
    setEditingHabit(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const deleteHabit = (id: string) => {
      setHabits(habits.filter(h => h.id !== id));
  };

  const logHabit = (id: string, value: number, date: string) => {
    setHabits(prevHabits => prevHabits.map(h => {
      if (h.id === id) {
        const newLogs = { ...h.logs, [date]: value };
        
        // Recalculate streak
        let streak = 0;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        if ((newLogs[todayStr] || 0) >= h.goal) {
          streak++;
        }
        
        for (let i = 1; i < 365; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const dStr = d.toISOString().split('T')[0];
          if ((newLogs[dStr] || 0) >= h.goal) {
            streak++;
          } else {
             if (i === 1 && streak === 0) continue; 
             break;
          }
        }
        
        return { ...h, logs: newLogs, streak };
      }
      return h;
    }));
  };

  const fetchInsights = async () => {
    setIsLoadingInsight(true);
    const insight = await getHabitInsights(habits);
    setAiInsight(insight);
    setIsLoadingInsight(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-md shadow-indigo-200 dark:shadow-none">
              <BrainCircuit className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">HabitFlow AI</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
              onClick={handleAddClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition-transform active:scale-95"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard size={18} />
            <span>Habits</span>
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'analytics' 
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>
        </div>

        {/* AI Insight Section */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden ring-1 ring-white/10">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <BrainCircuit size={120} />
          </div>
          
          {!aiInsight ? (
             <div className="relative z-10">
               <h2 className="text-xl font-bold mb-2">Unlock AI Insights</h2>
               <p className="text-indigo-100 mb-4 text-sm">Get personalized tips and analysis based on your tracking patterns.</p>
               <button 
                onClick={fetchInsights}
                disabled={isLoadingInsight}
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors flex items-center gap-2"
               >
                 {isLoadingInsight ? <Loader2 className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
                 {isLoadingInsight ? 'Analyzing trends...' : 'Generate Deep Analysis'}
               </button>
             </div>
          ) : (
            <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4">
               <div className="flex justify-between items-start mb-2">
                 <h2 className="text-xl font-bold">{aiInsight.title}</h2>
                 <button onClick={() => setAiInsight(null)} className="text-indigo-200 hover:text-white text-xs bg-white/10 px-2 py-1 rounded">Reset</button>
               </div>
               <p className="text-indigo-50 text-sm mb-3 leading-relaxed">{aiInsight.message}</p>
               <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                 <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200 mb-1">Coach Tip</p>
                 <p className="text-sm font-medium">{aiInsight.recommendation}</p>
               </div>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' ? (
          <div className="space-y-4">
             {habits.length === 0 ? (
               <div className="text-center py-12">
                 <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500 transition-colors">
                    <Plus size={32} />
                 </div>
                 <h3 className="text-slate-900 dark:text-white font-semibold text-lg">No habits yet</h3>
                 <p className="text-slate-500 dark:text-slate-400">Tap the + button on the right corner to start your journey.</p>
               </div>
             ) : (
               habits.map(habit => (
                 <HabitCard 
                    key={habit.id} 
                    habit={habit} 
                    onLog={logHabit} 
                    onDelete={deleteHabit}
                    onEdit={handleEditClick}
                 />
               ))
             )}
          </div>
        ) : (
          <Analytics habits={habits} />
        )}

      </main>

      <AddHabitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSaveHabit}
        initialData={editingHabit}
      />
    </div>
  );
};

export default App;