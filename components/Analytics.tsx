import React from 'react';
import { Habit } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface AnalyticsProps {
  habits: Habit[];
}

const Analytics: React.FC<AnalyticsProps> = ({ habits }) => {
  // Check if dark mode is active to conditionally style chart elements if needed, 
  // though we primarily handle it via CSS for the container.
  // Using a simple detection for tooltip background since Recharts doesn't inherit classes easily.
  const isDark = document.documentElement.classList.contains('dark');

  if (habits.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-100 dark:border-slate-800">
        <p className="text-slate-400 dark:text-slate-500">Add habits to see your analytics.</p>
      </div>
    );
  }

  // Calculate completion % for the last 7 days for all habits combined
  const getLast7DaysData = () => {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates.map(date => {
      let totalGoal = 0;
      let totalAchieved = 0;

      habits.forEach(h => {
        // Normalize goal: For boolean, goal is 1. For numeric, goal is h.goal.
        const val = h.logs[date] || 0;
        const completion = Math.min(val / h.goal, 1); // Cap at 100%
        totalAchieved += completion;
        totalGoal += 1;
      });

      const percentage = totalGoal === 0 ? 0 : (totalAchieved / totalGoal) * 100;
      
      // Format date for display (e.g., "Mon")
      const displayDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

      return {
        name: displayDate,
        score: Math.round(percentage)
      };
    });
  };

  const data = getLast7DaysData();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-200">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Weekly Consistency</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              hide 
              domain={[0, 100]}
            />
            <Tooltip 
              cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }}
              contentStyle={{ 
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#f1f5f9' : '#0f172a'
              }}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#6366f1' : '#cbd5e1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;