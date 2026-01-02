import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizQuestion } from '../types';

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("GeminiService: process.env.API_KEY is undefined. Environment variables found:", Object.keys(process.env));
    // We let the SDK throw the error, or throw one ourselves to be clear
    throw new Error("API_KEY is missing. Please set it in your environment variables (e.g., VITE_API_KEY in Railway).");
  }
  return new GoogleGenAI({ apiKey });
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
    // Return a readable error message to the UI
    if (error.message?.includes("API_KEY")) {
      throw new Error("API Key is missing. Please ensure VITE_API_KEY is set in Railway settings.");
    }
    if (error.status === 403) {
      throw new Error("API Key is invalid or has no quota.");
    }
    throw new Error(error.message || "Failed to generate quiz.");
  }
};