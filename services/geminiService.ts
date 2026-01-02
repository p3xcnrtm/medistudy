import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from '../types';

// Initialize the API client
// Note: process.env.API_KEY is injected by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuizFromText = async (textContext: string, numQuestions: number = 5): Promise<QuizQuestion[]> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Schema definition for the quiz output
    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 4 possible answers."
          },
          correctAnswer: { 
            type: Type.INTEGER,
            description: "The index (0-3) of the correct answer in the options array."
          },
          explanation: { type: Type.STRING }
        },
        required: ["id", "question", "options", "correctAnswer", "explanation"],
      },
    };

    const prompt = `
      You are a strict medical professor creating an exam for medical students.
      Based on the provided text content from a medical textbook/paper, generate ${numQuestions} high-quality, difficult multiple-choice questions (MCQs).
      
      Requirements:
      1. Questions must be relevant to the text provided.
      2. Provide 4 options for each question.
      3. Clearly mark the correct answer index (0-3).
      4. Provide a short clinical explanation for the correct answer.
      
      Source Text:
      "${textContext.substring(0, 15000)}" 
      // Truncating to avoid massive token usage in this demo, though Flash handles large context well.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.3, // Lower temperature for more factual accuracy
      },
    });

    if (response.text) {
      const quizData = JSON.parse(response.text) as QuizQuestion[];
      // Ensure IDs are unique numbers if the model hallucinates
      return quizData.map((q, idx) => ({ ...q, id: idx + 1 }));
    } else {
      throw new Error("No response text generated");
    }
  } catch (error) {
    console.error("Gemini Quiz Generation Error:", error);
    throw error;
  }
};
