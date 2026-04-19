import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    // In Vite, process.env might not be available directly in all environments
    // But the platform instructions specifically recommend this for GEMINI_API_KEY
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : (import.meta as any).env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please ensure it is set in your environment variables.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export async function performAgenticSearch(query: string, streamCallback?: (text: string) => void) {
  try {
    const ai = getAI();
    console.log("Starting agentic search for:", query);
    
    let responseStream;
    try {
      responseStream = await ai.models.generateContentStream({
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
    } catch (innerError) {
      console.warn("Search with tools failed, falling back to standard generation:", innerError);
      // Fallback: try without tools if the free tier key doesn't support them or quota is hit
      responseStream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: `Perform deep research and analysis on: "${query}". Even without live search tools, provide the most accurate and detailed report possible based on your training data. Use markdown, citations, and structured sections (Summary, Key Facts, Analysis).` }]
          }
        ]
      });
    }

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

    if (!fullText) {
      throw new Error("Empty response from AI");
    }

    return fullText;
  } catch (error) {
    console.error("Critical error in agentic search:", error);
    throw error;
  }
}
