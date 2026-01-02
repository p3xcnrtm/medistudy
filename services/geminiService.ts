import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizQuestion } from '../types';

// HARDCODED API KEY
const API_KEY = 'AIzaSyBFEuNrTdoo5e4l2h4cZML5jEXUBrZH5Ww';

const getAI = () => {
  // Directly use the hardcoded key
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const generateQuizFromText = async (textContext: string, numQuestions: number = 5): Promise<QuizQuestion[]> => {
  try {
    const ai = getAI();
    // Using the latest Gemini 3 Flash Preview as recommended for text tasks
    const model = 'gemini-3-flash-preview'; 
    
    // Explicitly typed Schema
    const responseSchema: Schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          correctAnswer: { 
            type: Type.INTEGER,
            description: "The index (0-3) of the correct answer."
          },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctAnswer", "explanation"],
      },
    };

    const prompt = `
      You are a strict medical professor creating an exam.
      Based on the provided text, generate ${numQuestions} multiple-choice questions (MCQs).
      
      Requirements:
      1. Provide 4 options for each question.
      2. The 'correctAnswer' must be the index (0, 1, 2, or 3).
      3. Include a clinical explanation.
      
      Source Text:
      "${textContext.substring(0, 20000)}"
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for consistent formatting
      },
    });

    if (response.text) {
      const quizData = JSON.parse(response.text) as QuizQuestion[];
      // Sanitize and ensure IDs
      return quizData.map((q, idx) => ({ 
        ...q, 
        id: idx + 1,
        // Ensure correctAnswer is a number
        correctAnswer: Number(q.correctAnswer)
      }));
    } else {
      throw new Error("Model returned empty response.");
    }
  } catch (error: any) {
    console.error("Gemini Quiz Generation Error:", error);
    if (error.status === 403) {
      throw new Error("API Key is invalid or has no quota.");
    }
    throw new Error(error.message || "Failed to generate quiz.");
  }
};
