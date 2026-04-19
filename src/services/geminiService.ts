import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    // Primary: User provided key
    let apiKey = "AIzaSyCko3rInG1WK-lZInN6N2cEnD-Px3RKAPI";
    
    // Fallback to environment if hardcoded one is somehow empty
    if (!apiKey) {
      apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : (import.meta as any).env.VITE_GEMINI_API_KEY;
    }
    
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
    console.log("Gemini Engine Triggered for:", query);
    
    let responseStream;
    const prompt = `Perform deep research on: "${query}". Provide a well-structured, factual response using markdown. Summary, Key Facts, and Analysis sections are required. Cite sources if possible [1].`;

    try {
      // Primary attempt with Agentic Tools (Flash supports this)
      responseStream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
    } catch (innerError: any) {
      console.warn("Agentic Google Search failed, using standard synthesis:", innerError);
      // Fallback: Standard high-density synthesis (no tools)
      responseStream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt + " (Analyze based on your neural training data)" }] }]
      });
    }

    let fullText = "";
    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullText += chunk.text;
        if (streamCallback) streamCallback(fullText);
      }
    }

    if (!fullText) throw new Error("Synthesis Engine returned no data. Your API Key may have reached its quota or is restricted in your region.");
    return fullText;

  } catch (error: any) {
    console.error("Critical Gemini Error:", error);
    // Extract meaningful error info for the user
    let userFriendlyError = "Neural Engine Failure";
    if (error?.message?.includes("quota")) userFriendlyError = "API Quota Exceeded (Free Tier Limit)";
    if (error?.message?.includes("API key")) userFriendlyError = "Invalid or Restricted Gemini API Key";
    if (error?.message?.includes("location")) userFriendlyError = "Service unavailable in your geographic region";
    
    throw new Error(`${userFriendlyError}: ${error.message || 'Unknown protocol error'}`);
  }
}
