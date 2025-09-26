"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { GoogleGenerativeAI } from "@google/generative-ai"

export function WeeklySchedule({ setSchedule }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [input, setInput] = useState('');

  const generateSchedule = async () => {
    setIsGenerating(true);
    try {
      const userInput = input;
      const events = await callGeminiAPI(userInput);

      // Make sure events is an array before setting it
      if (Array.isArray(events)) {
        // Convert ISO string dates to actual Date objects
        const formattedEvents = events.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));

        setSchedule(formattedEvents);
        // console.log("Schedule updated with:", formattedEvents);
      } else {
        console.error("Events is not an array:", events);
        setSchedule([]);
      }
    } catch (error) {
      console.error("Error generating schedule:", error);
      setSchedule([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const callGeminiAPI = async (userInput) => {
    const genAI = new GoogleGenerativeAI("AIzaSyDlcjeiBAXsMJ5d_Wnn5h-afC5X9bKmep8");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    Based on the following input, generate a detailed weekly schedule of events that a student can follow in JSON format:
    
    ${userInput}
    
    Create events in the following JSON structure, with each event having these properties:
    - id: a unique number for each event
    - title: the name of the activity (string)
    - start: the start date and time (in ISO format)
    - end: the end date and time (in ISO format)
    - category: one of ["work", "personal", "health", "study"]
    - color: corresponding color code ("#4F46E5" for work, "#F59E0B" for personal, "#10B981" for health, "#EC4899" for study)
    - description: a brief description of the activity
    
    Please generate a valid JSON array of at least 5 events for the current week, starting from today. Ensure all dates are properly formatted as ISO strings that JavaScript can parse with new Date().
    
    Return ONLY the JSON array with no additional text or formatting. Do not include backticks or the \`\`\`json marker.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Try to extract JSON if response contains extra text
    const finalResult = extractJsonEvents(responseText);
    console.log("Final result:", finalResult);
    return finalResult;
  };

  const extractJsonEvents = (geminiResponse) => {
    try {
      // First attempt: Try to parse the entire response as JSON
      try {
        const parsed = JSON.parse(geminiResponse);
        console.log("Successfully parsed JSON directly", parsed);
        return parsed;
      } catch (e) {
        console.log("Direct parsing failed, trying alternatives");

        // If that fails, look for JSON array in the text
        const jsonMatch = geminiResponse.match(/\[\s*\{.*\}\s*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log("Extracted JSON via regex", parsed);
          return parsed;
        }

        // If still no match, try to extract between code blocks
        const jsonStart = geminiResponse.indexOf("```json");
        const jsonEnd = geminiResponse.lastIndexOf("```");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonText = geminiResponse.substring(jsonStart + 7, jsonEnd).trim();
          const parsed = JSON.parse(jsonText);
          console.log("Extracted JSON from code block", parsed);
          return parsed;
        }
      }
    } catch (error) {
      console.error("Error extracting JSON events:", error);
      // Return a default set of events if extraction fails
      return getDefaultEvents();
    }
    console.log("All extraction methods failed, using default events");
    return getDefaultEvents();
  };

  const getDefaultEvents = () => {
    // Create a default set of events as fallback
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      {
        id: 1,
        title: "Team Meeting",
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(),
        category: "work",
        color: "#4F46E5",
        description: "Weekly team sync"
      },
      {
        id: 2,
        title: "Lunch Break",
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0).toISOString(),
        category: "personal",
        color: "#F59E0B",
        description: "Lunch break"
      },
      {
        id: 3,
        title: "Study Session",
        start: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 0).toISOString(),
        end: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 17, 0).toISOString(),
        category: "study",
        color: "#EC4899",
        description: "Exam preparation"
      }
    ];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white p-6 rounded-xl shadow-lg"
    >
      <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Weekly Schedule</h2>
      <Textarea
        placeholder="Describe your routine, commitments, and preferences. For example: 'I work 9-5 Mon-Fri, go to the gym MWF at 6pm, have a doctor's appointment this Thursday at 2pm, and need time to study for my exam this weekend.'"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="mb-4 h-40"
      />
      <Button
        onClick={generateSchedule}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Schedule with AI"
        )}
      </Button>
    </motion.div>
  );
}