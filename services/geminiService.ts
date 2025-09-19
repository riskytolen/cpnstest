import { GoogleGenAI, Type } from "@google/genai";
import { MODEL_NAME, getSystemInstruction } from '../constants';
import type { Question, QuestionCategory } from '../types';

const questionSchema = {
  type: Type.OBJECT,
  properties: {
    question: {
      type: Type.STRING,
      description: "Teks pertanyaan soal.",
    },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "Array berisi 4 string pilihan jawaban.",
    },
    correctAnswer: {
      type: Type.STRING,
      description: "String jawaban yang benar dari salah satu opsi.",
    },
    explanation: {
      type: Type.STRING,
      description: "Penjelasan singkat mengapa jawaban tersebut benar.",
    },
  },
  required: ["question", "options", "correctAnswer", "explanation"],
};

export const generateCPNSQuestion = async (category: QuestionCategory, apiKey: string): Promise<Question> => {
  if (!apiKey) {
    throw new Error("API Key is required to generate a question.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Buatkan saya satu soal CPNS untuk kategori: ${category}.`,
    config: {
      systemInstruction: getSystemInstruction(category),
      responseMimeType: "application/json",
      responseSchema: questionSchema,
    },
  });

  const jsonText = response.text.trim();
  try {
    const cleanedJson = jsonText.replace(/^```json\s*|```\s*$/g, '');
    return JSON.parse(cleanedJson) as Question;
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonText);
    throw new Error("Gagal mem-parsing data soal dari AI.");
  }
};
