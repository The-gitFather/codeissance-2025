'use client'

import { useState, useEffect } from 'react';
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, ChevronUp, CheckSquare, Square, Mail, User, School } from 'lucide-react';
import { useRouter } from "next/navigation";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ProfileCard from './ProfileCard';

// Initialize Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

// Define the schema for research outline (same as in AIResearchPlanner)
const researchSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      id: {
        type: SchemaType.NUMBER,
        description: "Unique identifier for the research area",
        nullable: false,
      },
      title: {
        type: SchemaType.STRING,
        description: "Title of the research area",
        nullable: false,
      },
      subtopics: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: {
              type: SchemaType.STRING,
              description: "Title of the subtopic",
              nullable: false,
            },
            description: {
              type: SchemaType.STRING,
              description: "Description of the subtopic",
              nullable: false,
            },
            completed: {
              type: SchemaType.BOOLEAN,
              description: "Completion status of the subtopic",
              nullable: false,
            },
          },
          required: ["title", "description", "completed"],
        },
        description: "Array of subtopics for the research area",
        nullable: false,
      },
    },
    required: ["id", "title", "subtopics"],
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [expandedGoals, setExpandedGoals] = useState({});
  const [completedItems, setCompletedItems] = useState({});
  const [progressValues, setProgressValues] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingItem, setGeneratingItem] = useState(null);
  const [progressHistory, setProgressHistory] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);

  // Load saved progress from localStorage when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.uid) {
      const savedData = localStorage.getItem(`course-progress-${user.uid}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setCompletedItems(parsedData.completedItems || {});
        setExpandedGoals(parsedData.expandedGoals || {});
        setProgressHistory(parsedData.progressHistory || []);
      }
    }
  }, [user?.uid]);

  // Return early if user or goals aren't loaded yet
  if (!user || !user.goals) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-500">Loading your goals...</div>
      </div>
    );
  }

  // Toggle expanded state for a goal with animation
  const toggleGoal = (index) => {
    setExpandedGoals(prev => {
      const newExpandedGoals = {
        ...prev,
        [index]: !prev[index]
      };

      // Save to localStorage
      if (user?.uid && typeof window !== 'undefined') {
        localStorage.setItem(`course-progress-${user.uid}`, JSON.stringify({
          completedItems: completedItems,
          expandedGoals: newExpandedGoals,
          progressHistory: progressHistory
        }));
      }

      return newExpandedGoals;
    });
  };

  // Generate weekly data for the progress chart
  const generateWeeklyData = (history) => {
    // Get the past 7 days (including today)
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Create data points for each day
    const weeklyData = dates.map(date => {
      // Find the entry for this date in history, or use zeros
      const historyEntry = history.find(entry => entry.date === date) || {};

      // Create an object with the date and progress for each goal
      const dataPoint = { date };

      // Format date for display (e.g., "Mon", "Tue", etc.)
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayObj = new Date(date);
      dataPoint.displayDate = dayNames[dayObj.getDay()];

      // Add progress for each goal
      if (user && user.goals) {
        user.goals.forEach((goal, goalIndex) => {
          dataPoint[`Goal ${goalIndex + 1}`] = historyEntry[goalIndex] || 0;
        });
      }

      return dataPoint;
    });

    setWeeklyData(weeklyData);
  };

  // Toggle completion state for a roadmap item
  const toggleCompletion = (goalIndex, itemIndex, event) => {
    // Stop the click event from propagating to the parent (which would trigger the generateCourse)
    event.stopPropagation();

    const key = `${goalIndex}-${itemIndex}`;
    setCompletedItems(prev => {
      const newCompletedItems = {
        ...prev,
        [key]: !prev[key]
      };

      // Save to localStorage
      if (user?.uid && typeof window !== 'undefined') {
        localStorage.setItem(`course-progress-${user.uid}`, JSON.stringify({
          completedItems: newCompletedItems,
          expandedGoals: expandedGoals,
          progressHistory: progressHistory
        }));
      }

      return newCompletedItems;
    });
  };

  // Generate AI course for the clicked roadmap item
  const generateCourse = async (goalIndex, itemIndex) => {
    const goalTitle = user.goals[goalIndex].title;
    const checkpointText = user.goals[goalIndex].roadmap[itemIndex];

    setIsGenerating(true);
    setGeneratingItem(`${goalIndex}-${itemIndex}`);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: researchSchema,
        },
      });

      const prompt = `Generate a structured research outline with key areas and subtopics for a study on ${goalTitle}, focusing on '${checkpointText}'.`;

      const result = await model.generateContent(prompt);
      const responseGemini = result.response.text();

      // Mark the item as completed
      const key = `${goalIndex}-${itemIndex}`;
      setCompletedItems(prev => {
        const newCompletedItems = {
          ...prev,
          [key]: true
        };

        // Save to localStorage
        if (user?.uid && typeof window !== 'undefined') {
          localStorage.setItem(`course-progress-${user.uid}`, JSON.stringify({
            completedItems: newCompletedItems,
            expandedGoals: expandedGoals,
            progressHistory: progressHistory
          }));
        }

        return newCompletedItems;
      });

      // Navigate to the AI video page with the generated content
      router.push(`/courses/ai-course/aivideo?title=${encodeURIComponent(goalTitle)}&data=${encodeURIComponent(responseGemini)}`);
    } catch (error) {
      console.error("Error generating research outline:", error);
      alert("Failed to generate course content. Please try again.");
    } finally {
      setIsGenerating(false);
      setGeneratingItem(null);
    }
  };

  // Update progress values when completedItems changes
  useEffect(() => {
    const newProgressValues = {};

    if (user && user.goals) {
      user.goals.forEach((goal, goalIndex) => {
        const completedCount = Object.keys(completedItems)
          .filter(key => key.startsWith(`${goalIndex}-`) && completedItems[key])
          .length;

        const percentage = goal.roadmap.length > 0
          ? (completedCount / goal.roadmap.length) * 100
          : 0;

        newProgressValues[goalIndex] = percentage;
      });
    }

    setProgressValues(newProgressValues);

    // Update progress history with a timestamp when progress changes
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Only add to history if there's meaningful progress
    if (Object.keys(newProgressValues).length > 0) {
      const newHistoryEntry = {
        date: dateStr,
        ...newProgressValues
      };

      // Check if we already have an entry for today
      const updatedHistory = [...progressHistory];
      const todayEntryIndex = updatedHistory.findIndex(entry => entry.date === dateStr);

      if (todayEntryIndex >= 0) {
        updatedHistory[todayEntryIndex] = newHistoryEntry;
      } else {
        updatedHistory.push(newHistoryEntry);
      }

      setProgressHistory(updatedHistory);

      // Save updated history to localStorage
      if (user?.uid && typeof window !== 'undefined') {
        localStorage.setItem(`course-progress-${user.uid}`, JSON.stringify({
          completedItems,
          expandedGoals,
          progressHistory: updatedHistory
        }));
      }

      // Generate weekly data for the chart
      generateWeeklyData(updatedHistory);
    }
  }, [completedItems, user]);

  // Goal background colors with gradients
  const goalColors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600',
    'from-red-500 to-red-600',
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6 px-12">
      <ProfileCard user={user} />
      <div className="w-full mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Your Goals</h1>

        <div className="space-y-8">
          {user.goals.map((goal, goalIndex) => {
            const isExpanded = expandedGoals[goalIndex];
            const colorClass = goalColors[goalIndex % goalColors.length];
            const completedCount = Object.keys(completedItems)
              .filter(key => key.startsWith(`${goalIndex}-`) && completedItems[key])
              .length;

            return (
              <div
                key={goalIndex}
                className="rounded-[4rem] overflow-hidden shadow-lg bg-white"
              >
                {/* Goal Header - Taller and more rounded */}
                <div
                  className={`py-8 px-16 bg-gradient-to-r ${colorClass} p-6 cursor-pointer relative overflow-hidden transition-all duration-300 ease-in-out hover:brightness-105`}
                  onClick={() => toggleGoal(goalIndex)}
                >
                  {/* White shine effect */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/20 via-transparent to-transparent"></div>

                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-2xl font-bold text-white">{goal.title}</h2>
                    <div className={`text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                      <ChevronDown size={28} />
                    </div>
                  </div>

                  <div className="w-full bg-white/30 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-white/60 transition-all duration-700 ease-out"
                      style={{ width: `${progressValues[goalIndex] || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Roadmap Items with animation */}
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                  <div className={`px-12 pt-4 pb-10 space-y-3 transition-all duration-300 bg-gradient-to-r ${colorClass} bg-opacity-10 hover:bg-opacity-2`}>
                    {goal.roadmap.map((item, itemIndex) => {
                      const itemKey = `${goalIndex}-${itemIndex}`;
                      const isCompleted = !!completedItems[itemKey];
                      const isCurrentlyGenerating = isGenerating && generatingItem === itemKey;

                      return (
                        <div
                          key={itemIndex}
                          className={`flex items-center p-4 rounded-lg transition-all duration-300 
                          cursor-pointer bg-gradient-to-r ${colorClass} bg-opacity-10 hover:bg-opacity-20
                          ${isCurrentlyGenerating ? 'opacity-70' : ''}`}
                          onClick={() => !isCurrentlyGenerating && generateCourse(goalIndex, itemIndex)}
                        >
                          <div
                            className="mr-3 text-white"
                            onClick={(e) => toggleCompletion(goalIndex, itemIndex, e)}
                          >
                            <div className="transition-all duration-300 transform hover:scale-110">
                              {isCompleted ?
                                <CheckSquare className="text-white" size={22} /> :
                                <Square className="text-white" size={22} />
                              }
                            </div>
                          </div>
                          <span className={`flex-grow text-white ${isCompleted ? 'line-through opacity-70' : 'opacity-100'}`}>
                            {item}
                          </span>
                          {isCurrentlyGenerating && (
                            <div className="ml-2 animate-pulse">
                              <div className="h-4 w-4 rounded-full bg-white"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Chart */}
        <div className="mt-12 bg-white p-8 rounded-3xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Weekly Progress Chart</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: '#4B5563' }}
                  tickLine={{ stroke: '#9CA3AF' }}
                />
                <YAxis
                  label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }}
                  tick={{ fill: '#4B5563' }}
                  tickLine={{ stroke: '#9CA3AF' }}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${Math.round(value)}%`, null]}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Legend verticalAlign="top" height={36} />

                {user.goals.map((goal, goalIndex) => {
                  // Get color for each goal line
                  const colors = [
                    '#3B82F6', // blue
                    '#8B5CF6', // purple
                    '#10B981', // green
                    '#F59E0B', // orange
                    '#EF4444', // red
                  ];
                  return (
                    <Line
                      key={goalIndex}
                      type="monotone"
                      dataKey={`Goal ${goalIndex + 1}`}
                      name={goal.title}
                      stroke={colors[goalIndex % colors.length]}
                      strokeWidth={3}
                      activeDot={{ r: 8 }}
                      dot={{ r: 4 }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-gray-500 text-sm">
            This chart tracks your daily progress on each goal over the past week
          </div>
        </div>
      </div>
    </div>
  );
}