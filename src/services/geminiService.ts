import { GoogleGenAI } from "@google/genai";

export async function performAgenticSearch(query: string, streamCallback?: (text: string) => void) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please ensure it is set in the 'Settings' menu.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // As per the gemini-api skill: use ai.models.generateContent with model and contents
    // Also, gemini-3-flash-preview is recommended for basic text tasks
    const prompt = `Perform deep research on: "${query}". Provide a well-structured, factual response using markdown. Summary, Key Facts, and Analysis sections are required. Cite sources if possible [1].`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";

    if (!text) {
      throw new Error("Neural Engine returned no data. Your API Key may have reached its quota.");
    }

    if (streamCallback) {
      // Simulate typing effect for the UI
      const words = text.split(" ");
      let current = "";
      for (const word of words) {
        current += word + " ";
        streamCallback(current);
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
    }

    return text;
  } catch (error: any) {
    console.error("Critical Gemini Error:", error);
    
    let userFriendlyError = "Neural Engine Failure";
    if (error?.message?.includes("quota")) userFriendlyError = "API Quota Exceeded (Free Tier Limit)";
    if (error?.message?.includes("API key")) userFriendlyError = "Invalid or Restricted Gemini API Key";
    if (error?.message?.includes("location")) userFriendlyError = "Service unavailable in your geographic region";
    if (error?.message?.includes("leaked")) userFriendlyError = "API Key was reported as leaked";

    throw new Error(`${userFriendlyError}: ${error.message || 'Unknown protocol error'}`);
  }
}
