import { GoogleGenAI, Type } from "@google/genai";
import { Habit } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getHabitInsights = async (habits: Habit[]): Promise<any> => {
  if (!habits || habits.length === 0) {
    return {
      title: "Let's Get Started!",
      message: "You haven't added any habits yet. Start by adding a habit to track your journey.",
      recommendation: "Try adding a simple habit like 'Drink Water' or 'Read 5 pages'."
    };
  }

  // Prepare a summarized version of the data for the model to reduce token usage
  const habitSummary = habits.map(h => {
    const logDates = Object.keys(h.logs).sort();
    
    // Calculate 30-day stats
    const today = new Date();
    let completionsLast30Days = 0;
    const last30Days = [];
    
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const val = h.logs[dateStr] || 0;
        
        last30Days.push({ date: dateStr, value: val });
        if (val >= h.goal) completionsLast30Days++;
    }

    const consistencyScore = Math.round((completionsLast30Days / 30) * 100);

    return {
      name: h.name,
      category: h.category,
      goal: h.goal,
      unit: h.unit,
      currentStreak: h.streak,
      consistency30Days: `${consistencyScore}%`,
      totalCompletionsAllTime: Object.values(h.logs).filter(v => v >= h.goal).length,
      recentActivity: last30Days.slice(-7) // Still keep detailed daily for last week
    };
  });

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze these user habits with a focus on long-term consistency and trends.
      
      User Habits Data:
      ${JSON.stringify(habitSummary)}
      
      Look for:
      1. Habits with high 30-day consistency (celebrate these).
      2. Habits with low consistency or broken streaks (offer encouragement).
      3. Patterns across categories (e.g., strong in Health but weak in Finance).
      
      Provide the response in strict JSON format with the following structure:
      {
        "title": "Short catchy title (e.g., 'crushing it!', 'needs focus')",
        "message": "A 2-3 sentence analysis of their progress, mentioning specific trends if visible.",
        "recommendation": "One specific actionable tip based on the 30-day data."
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            message: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
    
  } catch (error) {
    console.error("Error fetching Gemini insights:", error);
    return {
      title: "Service Unavailable",
      message: "We couldn't analyze your data right now.",
      recommendation: "Keep tracking your habits and try again later."
    };
  }
};