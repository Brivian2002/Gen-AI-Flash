import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function performAgenticSearch(query: string, streamCallback?: (text: string) => void) {
  try {
    const ai = getAI();
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: `You are an agentic search engine similar to GenSpark. Perform a deep research on the following query: "${query}". Provide a comprehensive, well-structured, and factual response. Use markdown for better readability. Cite potential sources if possible in text (e.g., [1]). Summary, Key Facts, and Deep Analysis sections are required. Be highly specific and technical where appropriate.` }]
        }
      ],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        if (streamCallback) {
          streamCallback(fullText);
        }
      }
    }

    return fullText;
  } catch (error) {
    console.error("Error in agentic search:", error);
    throw error;
  }
}
