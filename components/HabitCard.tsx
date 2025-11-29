import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { Check, Flame, Plus, Minus, Pencil } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  onLog: (id: string, value: number, date: string) => void;
  onDelete: (id: string) => void;
  onEdit: (habit: Habit) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onLog, onDelete, onEdit }) => {
  const today = new Date().toISOString().split('T')[0];
  const serverValue = habit.logs[today] || 0;
  
  // Use local state for immediate UI updates
  const [localValue, setLocalValue] = useState(serverValue);

  // Sync local state if prop changes (e.g. date change or external update)
  useEffect(() => {
    setLocalValue(habit.logs[today] || 0);
  }, [habit.logs, today]);

  const isCompleted = localValue >= habit.goal;
  const progressPercent = Math.min((localValue / habit.goal) * 100, 100);

  // Calculate last 7 days history for calendar visualization
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const isToday = dateStr === today;
    
    // For today, use optimistic local state. For past, use server state.
    const val = isToday ? localValue : (habit.logs[dateStr] || 0);
    const metGoal = val >= habit.goal;
    
    return {
      date: dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
      metGoal,
      isToday
    };
  });

  const handleIncrement = () => {
    const newValue = localValue + 1;
    setLocalValue(newValue);
    onLog(habit.id, newValue, today);
  };

  const handleDecrement = () => {
    if (localValue > 0) {
      const newValue = localValue - 1;
      setLocalValue(newValue);
      onLog(habit.id, newValue, today);
    }
  };

  const handleToggle = () => {
    const newValue = isCompleted ? 0 : habit.goal;
    setLocalValue(newValue);
    onLog(habit.id, newValue, today);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Health': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'Finance': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'Productivity': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20';
      case 'Mindfulness': return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border transition-all duration-300 hover:shadow-md ${isCompleted ? 'border-green-200 dark:border-green-900/30' : 'border-slate-100 dark:border-slate-800'}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
        <div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getCategoryColor(habit.category)}`}>
            {habit.category}
          </span>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">{habit.name}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Goal: {habit.goal} {habit.unit}</p>
        </div>
        
        {/* Streak & Calendar Visualization */}
        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex items-center space-x-1 text-orange-500 bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded-md border border-orange-100 dark:border-orange-900/50 self-start sm:self-end">
            <Flame size={16} fill="currentColor" />
            <span className="font-bold text-sm">{habit.streak} Day Streak</span>
          </div>
          
          <div className="flex gap-1">
            {last7Days.map((day) => (
              <div 
                key={day.date}
                className={`
                  w-6 h-8 rounded-md flex flex-col items-center justify-center text-[10px] font-bold border transition-all duration-200
                  ${day.metGoal 
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                    : day.isToday
                      ? 'bg-white dark:bg-slate-800 border-indigo-400 dark:border-indigo-500 text-slate-600 dark:text-slate-300 ring-2 ring-indigo-50 dark:ring-indigo-900/20'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600'
                  }
                `}
                title={`${day.date}: ${day.metGoal ? 'Completed' : 'Missed'}`}
              >
                <span className="leading-none">{day.dayName}</span>
                {day.metGoal && <div className="mt-1 w-1 h-1 bg-white rounded-full" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs font-medium mb-1.5">
          <span className={`${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {isCompleted ? 'Goal Reached!' : 'Daily Progress'}
          </span>
          <span className="text-slate-400 dark:text-slate-500">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-1 ${
              isCompleted 
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
                : 'bg-gradient-to-r from-indigo-400 to-indigo-500'
            }`} 
            style={{ width: `${progressPercent}%` }}
          >
            {isCompleted && <div className="h-1.5 w-1.5 bg-white/50 rounded-full animate-pulse" />}
          </div>
        </div>
        <div className="mt-1 text-right text-xs text-slate-400 dark:text-slate-600">
          {localValue} / {habit.goal} {habit.unit}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 gap-2">
        {habit.type === 'boolean' ? (
          <button
            onClick={handleToggle}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg font-medium transition-colors ${
              isCompleted 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isCompleted ? <span className="flex items-center gap-2"><Check size={18} /> Completed</span> : 'Mark Done'}
          </button>
        ) : (
          <div className="flex items-center space-x-3 w-full flex-1">
            <button 
              onClick={handleDecrement}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 dark:disabled:opacity-30 transition-colors"
              disabled={localValue <= 0}
            >
              <Minus size={18} />
            </button>
            <div className="flex-1 text-center font-semibold text-slate-700 dark:text-slate-200">
              {localValue}
            </div>
            <button 
              onClick={handleIncrement}
              className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
        
        <div className="flex gap-1 border-l border-slate-200 dark:border-slate-800 pl-2 ml-1">
          <button 
             onClick={() => onEdit(habit)}
             className="p-2 text-slate-400 hover:text-indigo-500 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
             aria-label="Edit habit"
          >
              <Pencil size={18} />
          </button>
          
          <button 
             onClick={() => onDelete(habit.id)}
             className="p-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
             aria-label="Delete habit"
          >
              <span className="text-xs font-semibold">DEL</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitCard;